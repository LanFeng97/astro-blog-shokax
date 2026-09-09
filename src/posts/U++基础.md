---
title: U++基础
date: 2026-08-19 15:19:50
categories: [UE]
tags: [c++, UE]
---

# C++基础部分

## 注释

```cpp
多行注释
/**
 *
 */
 普通注释
//
```

## include包含头文件

当需要使用相关代码时，需要在.h文件中使用#include 来包含相关代码头文件，才能调用他的相关代码
例如#include “AbilitySystemComponent.h”则可以使用该组件的相关代码

## Class类声明

```cpp
class Animal{
    public:
        int age;
}//定义动物类

class Human : public Animal{

}//定义人物类，继承自Animal

class Dog ： public Animal{

}//定义狗类，继承自Animal
根据继承机制，Human类继承自Animal，所以Human中也有了Animal的变量。
```

## 定义常量 静态变量

const int MAX_AGE;//定义了一个叫做最大年龄的整数型常量，作为常量，++命名必须全部大写++

static const int MAX_AGE；//静态变量static意味着，别处访问这个变量的时候可以不将它实例化，并且共用一个内存；
例如

```cpp
class Animal{
    public:
        int age；整数类型
        static int MAX_AGE；
}

class Dog : public Anmimal{
    public:
    Human owner;
    owner.age;       //普通变量，需要一个实例才能以这种方式对其中的成员变量访问
    Animal::MAX_AGE; //stastic静态变量可以直接访问
}

```

通过静态的方式，可以共享的进行访问，子类可以快速得到父类中的变量值，不需要问每一个实例他们的变量是什么情况，不管地图中有多少个该实例，他们的MAX_AGE都是共享的，能节约内存。

## 构造函数

在虚幻蓝图中，一个actor中存在“构造脚本”，可以在actor创建时对一些东西进行预设；或者一个actor的某些变量设置了生成时公开，在actor创建时需要填入这些公开的变量。代码中的构造函数也是这样的作用
在普通的c++中，可以通过如下方式构造类的构造函数：

```cpp
class Animal{
    public:
        int age；
        bool isMale;
        static int MAX_AGE；
        Animal(int age,bool isMale);
        //定义时 构造函数与类名名称相同，()中的为构造时需要输入的参数。例如在cpp文件中需要创建某个Animal类时：Animal Dog =Animal(11,True);
        //构造函数没有返回值
}
```

## 虚函数virtual

在ue蓝图中，可以在父类中写一个空函数。
而在其子类中，可以对那个该函数进行函数重载（重写），去进行具体实现。

# U++部分

## UE的class声明，UCLASS()

```cpp
UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{
	GENERATED_BODY()

};//这是UE的独特的类创建写法，一在UE创建一个新的C++类时会自动添加
```

## UE常用变量名

```cpp
class Animal{
    public:
        int age；整数类型
        float hight；浮点数
        bool isMale；布尔
        FString name；字符串
        FText nickname；文本     //文本一般用于大段的，或者需要用于本地化的内
        FName socketname；命名   //在ue中例如在使用骨骼插槽命名等时，其实都是命名类型。比较两个命名会比字符串快很多。
        FVector location；向量
        FRotator rotation；旋转
        FTransform transform；变换  //变换包含位置、旋转、缩放
}
```

## 宏

宏的定义方式

```cpp
#define PI 3.1415926//定义了一个常量宏,宏命名需要为全大写
#define MAX(a,b) ((a)>(b)?(a):(b))//定义了一个功能为比大小的宏函数
#define GETMAX(a,b) MAX(a,b)//用宏定义宏，相当于创建了一个宏的别名

class Animal{
    public:
        int age；
        bool isMale;
        static int MAX_AGE=PI；//赋予MAX_AGE为定义的宏的值
        //只要出现了宏的调用，就会直接替换。即将PI替换为3.1415926.这种替换不进行类型检查。
        //宏的替换发生在编译之前。预处理器进行文本替换。
        static int MAX_NUM=MAX(10,20)；//MAX_NUM的值会被替换为20。在执行时，MAX(10,20)会被替换为((10)>(20)?(10):(30))
}
```

## UPROPERTY()与UFUNCTION()

UPROPERTY()用于属性变量等声明时。在括号中定义变量。
例如

```cpp
UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{
	GENERATED_BODY()
	public:
    UPROPERTY(EditAnywhere,BlueprintReadWrite，Category="Character|HP"，ReplicatedUsing = OnRep_HP)//定义了HP这个浮点数变量，是可编辑实例、蓝图可以读写、类别是Character的HP类、用于网络复制
    float HP;

    //UFUNCTION()用于函数声明时添加说明符
    UFUNCTION(BlueprintCallable,Category = "Character|HP")
    float GetHP();//float类型意味着函数输出将为float。如果为void则禁止返回为任何值
    //函数没有ReplicatedUsing

    UFUNCTION(BlueprintCallable,Category = "Character|HP")
    void GetResult(float inputA, int inputB, float& outA, int& outB);
    //在类型之后增加“&”符号可以代表为输出值，如此可以得到一个，有两个输入两个输出的函数。
};
```

### 常用说明符

UPROPERTY()宏中，常用如下说明符

```cpp
//////////编辑器可见性相关
EditAnywhere         //在蓝图类默认值 和 关卡中的实例都可编辑
EditDefaultsOnly     //仅在蓝图默认值可编辑 不可在实例上编辑
EditInstanceOnly     //不可在蓝图默认值编辑 仅在关卡实例上编辑
VisibleAnywhere      //在任何地方都可见 且只读
VisibleDefaultsOnly  //仅在蓝图默认值可见 且只读
VisibleInstanceOnly  //仅在关卡实例上可见 且只读
//EditAnywhere、EditDefaultsOnly、EditInstanceOnly 互斥；Visible... 与 Edit... 也互斥。
//其中的EditAnywhere、VisibleAnywhere最为常用

//////////蓝图读写权限
BlueprintReadWrite  //变量蓝图可读写
BlueprintReadOnly   //变量在蓝图中只读 用于生命值这样的计算后的公开状态值
//BlueprintReadWrite与BlueprintReadOnly互斥

//////////网络复制
Replicated                     //属性值会从服务器复制到所有客户端  用于同步游戏状态，如角色生命值、分数。
ReplicatedUsing = OnRep_Name   //网络复制启用 OnRep_为固定前缀，Name为变量名，要与需要开启的变量的名称一致    属性复制后，会在客户端自动调用指定的回调函数  在客户端收到新值后更新UI或触发特效，回调函数通常是 OnRep_VariableName()。

//其他功能
Category="Character|HP" //在蓝图编辑器中时所属的分类Character为大分类，|为间隔，右边为次一级分类
Config                  //属性的默认值可从对应的 .ini 配置文件中加载。	存储玩家可修改的选项，如分辨率、音量。
Transient               //属性值不会被保存（序列化），也不会被加载。	存储临时运行时数据，如每帧计算的临时速度。
AdvancedDisplay         //在编辑器的细节面板中，将属性默认折叠到“高级”下拉菜单中。	隐藏不常用的高级参数，保持面板整洁。
```

UFUNCTION()常用如下说明符

```cpp
//蓝图交互相关
BlueprintCallable           //函数可以在蓝图中被直接调用（有执行引脚）。	提供一个可供蓝图调用的功能接口。
BlueprintPure               //纯函数，没有执行引脚，不能修改对象状态，通常用于获取数值。	提供一个计算或获取数据的接口，如 GetHealthPercent()。
BlueprintImplementableEvent //函数在C++中没有实现，必须在蓝图中实现。	在C++中定义事件接口，由蓝图设计师填充具体逻辑。
BlueprintNativeEvent        //函数在C++中有默认实现，但可以被蓝图覆盖（重写）。	提供默认行为，同时允许蓝图进行自定义扩展。

//BlueprintPure 隐式包含了 BlueprintCallable。对于 BlueprintNativeEvent，需要实现一个名为 函数名_Implementation 的C++函数作为默认实现。

//网络与多玩家
Server                      //函数在客户端被调用时，实际会在服务器上执行。	处理玩家输入等需要服务器权威的逻辑。
Client                      //函数在服务器上被调用时，会在拥有该对象的客户端上执行。	向特定客户端发送UI更新或特效。
NetMulticast                //函数在服务器上被调用时，会在所有客户端上执行。	播放全屏特效或全局声音。
BlueprintAuthorityOnly      //函数仅在拥有网络权限的机器（通常是服务器）上执行。	防止客户端执行关键逻辑。
//Server 和 Client 函数也要求实现一个 _Implementation 的版本。

//其他功能
CallInEditor            //在编辑器中选中对象时，可以在细节面板通过按钮调用此函数。	制作编辑器工具函数，如“重置位置”。
Exec                    //函数可以作为控制台命令被执行。	创建调试或作弊指令，如 "God" 或 "AddHealth 100"。
Category = "Name"       //和 UPROPERTY 类似，用于在蓝图中对函数进行分类。
```

## 网络复制

### Replicated

是一个用于UPROPERTY的说明符，标记这个变量要从服务器复制到客户端

### ReplicatedUsing

添加头文件
使用ReplicatedUsing函数需要添加头文件#include "Net/UnrealNetwork.h"
注意，ue类添加的任何头文件需要在#include "类名.generated.h"之前

ReplicatedUsing为多人网络游戏中使用的同步说明符。添加了ReplicatedUsing后，在下面例子中，当客户端HP的值发生变化时，就会自动调用OnRep_HP这个函数
OnRep函数只会在客户端执行。如果是服务器修改变量，则不会触发OnRep

```cpp
UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{
	GENERATED_BODY()
	public:
    UPROPERTY(EditAnywhere,BlueprintReadWrite，ReplicatedUsing = OnRep_HP)
    float HP;

    //定义OnRep_HP函数
	UFUNCTION()
    void OnRep_HP(const FGameplayAttributeData& OldHP)
};
```

在蓝图中，变量勾选Replicated（复制）+ Rep Notify 等价 C++ 的ReplicatedUsing=xxx。蓝图 Rep Notify 就是这个 OnRep 回调。

## 定义网络同步函数

```cpp
UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{
	GENERATED_BODY()
	public:
    UPROPERTY(EditAnywhere,BlueprintReadWrite，ReplicatedUsing = OnRep_HP)
    float HP;

    //定义OnRep_HP函数
	UFUNCTION()
    void OnRep_HP(const FGameplayAttributeData& OldHP)
};
```

# 常用前缀
