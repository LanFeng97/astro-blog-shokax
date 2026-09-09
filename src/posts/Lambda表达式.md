---
title: Lambda表达式
date: 2026-08-21 14:56:10
categories: [c++]
tags: [c++11]
---

Lambda表达式
用于快速定义一个匿名函数对象 被称作闭包Closure 的简便方法

常见使用情况是在一些函数调用中，需要一些简单函数作为参数时，可以用lambda表达式，比起重新定义一个函数或者函数对象会更快捷，代码也更加简洁。

# 简单案例

常见定义方式

```cpp
[用于在函数代码中使用的捕获变量](参数列表)可选限定符->返回值类型{
    函数代码
}
```

```cpp
int main(void)
{
    int x=10;
    float y=20.0;
    auto p = [x,&y](int a,int b)->float{
        y =5.0;
        return x+y+a+b;
    }
    cout<<p(2,3);//输出20
}
```

## lambda作为函数参数的案例

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std

int main() {
    vector<int> scores = {50, 30, 80, 10, 90};

    //Lambda 直接作为排序值规则传给sort函数
    sort(scores.begin(), scores.end(), [](int a, int b) {
        return a > b;   //返回true表示a排在b前面,降序
    });

    for (int v : scores) {
        :cout << v << " ";  //输出：90 80 50 30 10
    }
    return 0;
}
```

```cpp
#include <iostream>

// 模板参数Func可接受任意可调用对象
template <typename Func>
void repeat(int times, Func action) {
    for (int i = 0; i < times; ++i) {
        action(i);
    }
}

int main() {
    auto print = [](int i) { std::cout << "i = " << i << std::endl; };
    repeat(5, print);   // 传入一个lambda变量
    repeat(2, [](int x) { std::cout << "平方: " << x * x << std::endl; }); //直接传临时lambda
    return 0;
}
输出
i = 0
i = 1
i = 2
i = 3
i = 4
平方: 0
平方: 1
```

# Lambda的捕获方式

## 值捕获与引用捕获

在案例下面中，[x，&y]对x和y的值进行了捕获。

```cpp
int main(void)
{
    int x=10;
    float y=20.0;
    auto p = [x,&y](int a,int b)->float{
        y =5.0;
        return x+y+a+b;
    }
    cout<<p(2,3);//输出20
}
```

### 值捕获

值捕获：案例中，对x进行了++值捕获++，仅仅将该变量的值拷贝到Lambda表达式中作为数据成员。值捕获的变量在表达式定义即确定，不会随着外部变量变化而变化，同时也不能在表达式中对值捕获的外部变量修改，除非使用mutable关键字。
[跳转mutable描述](/posts/mutable%E5%85%B3%E9%94%AE%E5%AD%97/)

### 引用捕获

引用捕获：案例中对y进行了++引用捕获++，使用 & 加变量名，将该变量的引用传递到 Lambda 表达式中。引用捕获的变量在 Lambda 表达式调用时才确定，会随着外部变量的变化而变化。引用捕获的变量可以在 Lambda 表达式中修改，但要注意生命周期的问题，避免悬空引用的出现。

### 引用捕获生命周期问题

引用捕获是十分危险的，果 Lambda 的生命周期超过了所捕获局部变量的生命周期（例如将 Lambda 返回出去、存入容器或作为线程任务），引用将悬空（野引用），导致未定义行为。

```cpp
//危险示例：返回一个 Lambda
auto create_lambda() {
    int local_var = 42;
    //错误,返回的Lambda持有local_var的引用，但函数返回后local_var被销毁
    return [&]() { return local_var; };
}

//正确做法：如果必须返回，应使用值捕获 [=]
auto create_lambda_safe() {
    int local_var = 42;
    return [=]() { return local_var; }; //拷贝一份，安全
}
```

## 隐式捕获

隐式捕获：捕获列表 [] 中不显式指定具体变量名，而是使用捕获默认值（= 或 &），让编译器自动推导 Lambda 函数体内使用了哪些外部变量，并按照指定的方式去捕获它们。

[=]：隐式值捕获。函数体内用到的所有外部变量，均被复制进 Lambda 内部（只读，不可修改，除非加 mutable）。

[&]：隐式引用捕获。函数体内用到的所有外部变量，均以引用方式传入（可修改外部变量，需注意生命周期）。

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int x = 10;
    double y = 3.14;
    std::string msg = "Hello";

    //1. 隐式值捕获[=]拷贝一份进来
    auto lambda_copy = [=]() {
        // x = 20; //默认值捕获不可修改，这样会报错
        std::cout << "值捕获: " << x << ", " << y << ", " << msg << std::endl;
    };
    lambda_copy();

    //2. 隐式引用捕获[&]引用外部变量
    auto lambda_ref = [&]() {
        x = 100;      //直接修改外部的x
        y = 2.71;     //直接修改外部的y
        msg = "World";
        std::cout << "引用捕获: " << x << ", " << y << ", " << msg << std::endl;
    };
    lambda_ref();

    //验证外部变量已被修改
    std::cout << "外部变量被修改后: " << x << ", " << y << ", " << msg << std::endl;

    return 0;
}
输出
值捕获: 10, 3.14, Hello
引用捕获: 100, 2.71, World
外部变量被修改后: 100, 2.71, World
```

### 隐式+显式混合捕获

可以在使用显式捕获的同时对个别变量覆盖捕获方式
[=, &x]：默认值捕获，但 x 显式指定为引用捕获。

[&, x]：默认引用捕获，但 x 显式指定为值捕获。

```cpp
int a = 1, b = 2, c = 3;

//默认值捕获，但b按引用捕获（可以修改b）
auto mix1 = [=, &b]() {
    //a = 10; // 错误。a是值捕获不可修改
    b = 20;    // 正确，b 是引用
    //c是值捕获，只读
    std::cout << a << ", " << b << ", " << c << std::endl;
};
mix1();
std::cout << "外部 b: " << b << std::endl; // 输出 20

// 默认引用捕获，但 c 按值捕获（c 只读，不影响外部）
auto mix2 = [&, c]() {
    a = 100;   //引用，修改外部 a
    b = 200;   //引用，修改外部 b
    //c=300; // 错误，c是值捕获，不可修改
    std::cout << a << ", " << b << ", " << c << std::endl;
};
mix2();
std::cout << "外部 a, b: " << a << ", " << b << std::endl; //100, 200
```

# 根据使用场景选择捕获方式

1、Lambda 仅在本函数内同步调用，且需要修改外部变量
[&]
简洁高效，无拷贝开销

2、Lambda 需要被存储或异步执行（如 std::thread）
[=] 或显式列出变量按值 [a, b]
防止悬空引用，安全性高

3、对象很大，不想拷贝，但确定生命周期安全
混合捕获 [=, &big_obj]
平衡性能和安全性

4、类成员函数中捕获成员变量
显式写 [=, this] 或 [&]
遵循 C++20 规范，避免歧义

# c++20的补充

c++20之前在类成员函数中写 [=] 会隐式捕获 this 指针（导致按引用捕获当前对象，即使你以为是按值）。C++20 开始，[=] 不再隐式捕获 this，如果你需要访问成员变量，必须显式写 [=, this] 或 [&, this]。

```cpp
class MyClass {
    int value = 10;
public:
    void test() {
        //C++20 之前合法，C++20起编译报错（访问value需要this）
        //auto bad = [=] { return value; };

        //C++20 正确写法：显式指明捕获 this
        auto good1 = [=, this] { return value; }; //值拷贝其他变量，this按引用
        auto good2 = [&] { return value; };       //引用捕获所有，包括this（依然可以）
    }
};
```
