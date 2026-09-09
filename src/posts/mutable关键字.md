---
title: mutable关键字
date: 2026-08-21 15:32:05
categories: [c++]
tags: [c++]
---

# 作用

mutable用于突破const的限制。使用后可以在const函数或者const对象中修改成员变量。通常用于缓存、延迟计算、日志记录等场景。被mutable修饰的变量将在生命周期内逻辑上可变，物理上可写。

# 注意

mutable不用用于修饰static成员变量。因为 static 不属于对象实例，不受 const 对象限制，也不能用于修饰 const 成员变量（本身已不可变）和引用成员（引用不可重新绑定）。它只能修饰非静态、非引用、非常量的数据成员。

# 使用场景

在const成员函数中修改变量

缓存与延迟计算（mutable T cache，配合 mutable bool is_dirty）。

多线程同步（mutable std::mutex mtx，在 const读函数中加锁）。

调试与日志计数（mutable size_t debug_call_count，不影响业务逻辑）。

Lambda 表达式：标记为mutable时，允许修改按值捕获的副本。去掉 operator() 的 const 限定，允许修改按值捕获的副本。如果 Lambda 使用 [&] 按引用捕获，即使不加 mutable 也能修改外部变量；只有 [=] 按值捕获时，才需要 mutable 来修改副本（且不影响原外部变量）

# 使用案例

## const成员函数修改变量

```cpp
    class num {
    private:
        int data;
        mutable int access_count; //mutable允许在const函数中修改

    public:
        num(int val) : data(val), access_count(0) {}

        int get_data() const {
            access_count++; //修改mutable成员，编译通过
            return data;
        }

        int get_count() const {
            return access_count;
        }
    };
    void test_basic() {
        const num obj(100); //const对象
        obj.get_data();            //合法，因为get_data是const且修改了mutable成员
        obj.get_data();
        int cnt = obj.get_count(); //cnt == 2
    }
```

## 缓存与延迟计算（mutable T cache + mutable bool dirty）

用于昂贵的计算，如复杂数学运算、数据库查询。第一次调用时计算结果并缓存，后续直接返回缓存值。注意：修改缓存不影响对象的“逻辑常量性”（即外部看起来对象状态未变）。

```cpp
class圆形面积计算器 {
private:
    double radius;
    mutable double cached_area;   //缓存计算结果
    mutable bool is_dirty;        //true表示缓存失效，需重算

    double do_expensive_calc(double r) const {
        //模拟高开销计算(例如复杂积分或网络请求)
        return 3.1415926535 * r * r;
    }

public:
    圆形面积计算器(double r) : radius(r), cached_area(0.0), is_dirty(true) {}

    double get_area() const {
        if(is_dirty) {
            cached_area = do_expensive_calc(radius); //修改缓存
            is_dirty = false;                         //标记缓存有效
        }
        return cached_area;
    }

    void set_radius(double r) {
        radius = r;
        is_dirty = true; //半径改变，缓存失效(此函数非const，可以随意改)
    }
};

//使用示例
void test_cache() {
    const 圆形面积计算器 circle(5.0); //const对象
    double area1 = circle.get_area(); //第一次，触发计算
    double area2 = circle.get_area(); //第二次，直接返回缓存，性能极高
}
```

## 多线程同步mutable std::mutex，在const读函数中加锁

为什么需要mutable互斥锁：互斥锁本身是一个需要被修改的对象（加锁/解锁会改变其内部状态，如持有者线程ID和等待队列）。在const成员函数中，对象被视为“只读”，但为了线程安全地读取数据，我们必须对共享数据进行加锁保护。将互斥锁声明为mutable，允许const函数修改锁的状态，同时保证了对象的逻辑常量性（读取操作不改变业务数据）。

若不加锁，多线程同时调用get_value()会造成数据竞争（Data Race），导致未定义行为（读到的可能是损坏的中间值）。

std::lock_guard是RAII（资源获取即初始化）锁，构造时自动锁定mtx，析构时自动解锁。即使函数中途抛出异常，锁也能安全释放，避免死锁。

注意：mutable只作用于互斥锁本身，不作用于data。data仍然受到保护，且未被修改。

```cpp
#include <mutex>

class线程安全配置 {
private:
    int data;
    mutable std::mutex mtx; //mutable允许在const函数中加锁/解锁

public:
    线程安全配置(int val) : data(val) {}

    int get_value() const {
        //std::lock_guard构造时锁定mtx，析构时解锁
        //加锁期间，其他线程访问get_value会被阻塞，保证读取到的data一致
        std::lock_guard<std::mutex> lock(mtx);
        return data; //业务数据本身未被修改，逻辑上仍是const
    }

    void set_value(int val) {
        //非const函数同样需要加锁保护写操作
        std::lock_guard<std::mutex> lock(mtx);
        data = val;
    }
};

//多线程安全使用示例(思路)
void test_mutex() {
    线程安全配置 config(42);
    //可同时创建多个线程，安全调用config.get_value()，不会出现数据竞争
}
```

## 调试与日志计数

此场景不影响任何业务逻辑输出，纯粹用于统计或日志。修改计数器不影响对象的“值”。

```cpp
class用户认证器 {
private:
    std::string password_hash;
    mutable size_t verify_call_count; //仅用于调试统计，不影响认证结果

    bool check_hash(const std::string& input) const {
        //模拟哈希比对逻辑
        return input == password_hash;
    }

public:
    用户认证器(const std::string& hash) : password_hash(hash), verify_call_count(0) {}

    bool verify_password(const std::string& input) const {
        verify_call_count++;               //记录调用次数
        bool result = check_hash(input);
        if(!result) {
            //可在此处记录调试日志，但计数始终累加
        }
        return result;
    }

    size_t get_debug_count() const {
        return verify_call_count; //仅用于性能分析或调试面板
    }
};

//使用示例
void test_debug() {
    const 用户认证器 auth("secure123");
    auth.verify_password("wrong");
    auth.verify_password("secure123");
    size_t count = auth.get_debug_count(); //count == 2，业务逻辑完全不受影响
}
```

## Lambda表达式，mutable修改按值捕获的副本

Lambda表达式默认生成的operator()是const限定的。不加mutable时，按值捕获的变量是只读的；加mutable后，去掉const限定，允许修改副本，且不影响外部原始变量。按引用捕获则天然可以修改外部变量，无需mutable。

```cpp
#include <iostream>

void test_lambda() {
    int x = 10;
    int y = 20;

    //情况1: 按值捕获[=]，不加mutable -> 编译错误
    //auto lambda1 = [=]() { x = 30; }; //报错: 表达式必须是可修改的左值

    //情况2: 按值捕获[=]，加mutable -> 修改副本，外部x不变
    auto lambda2 = [=]() mutable {
        x = 30; //修改的是x的副本
        //注意: y也被捕获了，但未使用
    };
    lambda2();
    //此时外部x仍为10，不受影响

    //情况3: 按引用捕获[&]，无需mutable，直接修改外部变量
    auto lambda3 = [&]() {
        y = 40; //修改外部变量y
    };
    lambda3();
    //此时外部y变为40

    //验证结果
    // x == 10, y == 40
}
```
