---
title: GAS快速应用
date: 2026-08-14 16:02:17
categories: [UE]
tags: [UE, GAS]
---

# GAS简要

## 什么是GAS

GAS（Gameplay Ability System，游戏技能系统） 是虚幻引擎内置的一个强大框架，他是一套用于组织、驱动和管理游戏中所有与“技能”和“属性”相关逻辑的工具集

## GAS的核心作用

GAS的核心价值在于，它将游戏中的“行为”（如攻击、施法）和“数值”（如生命值、力量）抽象为可复用、可数据驱动的资产，为处理buff与属性等系统提供了标准解决方案，能提高开发效率、增强代码可维护性。
主要包括：

1、统一管理游戏数值与行为：无论是伤害、生命值，还是动态的武器射速、移动速度修改，或是技能的冷却与消耗，都可以通过GAS统一实现和管理。

2、应对复杂逻辑的“复杂度爆炸”：随着游戏发展，技能会加入消耗、冷却、Buff/Debuff、连击等机制，传统编码方式复杂度会急剧上升，同时技能与角色类强绑定，修改一个技能可能会意外破坏另一个。GAS通过模块化设计，让开发者能清晰地组织和扩展这些逻辑。

3、原生支持网络多人游戏：GAS对网络复制（Replication）有良好的支持，能帮助开发者节省大量为多人游戏适配功能的时间。在不使用GAS时，需要手动为每个变量和时间编写复杂的网络复制代码，容易出错。同时，例如射击等操作，如果放在服务器上，意味着在延迟后才能同步到客户端，会劣化游戏体验。

4、提供开箱即用的调试工具：GAS自带Gameplay调试器、可视化记录器等工具，方便开发者追踪技能的执行流程和状态。

## GAS核心组件

技能系统组件（Ability System Component, ASC）：它是一个ActorComponent，必须附加到任何需要使用GAS的角色（Actor）上。它负责管理该角色拥有的所有技能、属性和效果，并处理技能激活等所有交互。

游戏技能（Gameplay Ability, GA）：定义了角色可以执行的具体行为或技能。它可以是一个简单的攻击，也可以是一个复杂的、带有多阶段效果的魔法。

游戏属性（Gameplay Attribute）和属性集（Attribute Set）：Gameplay Attribute是存储在Attribute Set中的浮点数值，用于表示角色的各种状态，如生命值、魔法值、力量等。一个Attribute Set可以包含一组相关的属性。

游戏效果（Gameplay Effect, GE）：这是对属性进行修改的容器。例如，一个“伤害”GE可以瞬间减少生命值属性，一个“治疗”GE可以随时间逐渐恢复生命值。GE是实现Buff、Debuff、伤害、治疗等效果的核心机制。

游戏提示（Gameplay Cue）：用于触发与技能或效果关联的视听反馈，如粒子特效、声音、UI动画等。它提供了一种将游戏逻辑与表现层解耦的数据驱动方法。

GameplayTag

## 使用步骤简介

使用GAS通常遵循以下步骤：

启用插件：GAS是作为一个插件存在的。你需要在虚幻编辑器的“编辑 > 插件”中，找到并启用 “Gameplay Abilities” 插件。

配置C++项目（关键步骤）：

GAS强烈建议在C++项目中使用，因为核心的Gameplay Attribute只能在C++中定义。

在你的项目\*.Build.cs文件中，将"GameplayAbilities"、"GameplayTags"和"GameplayTasks"添加到PublicDependencyModuleNames列表中。

添加技能系统组件（ASC）：为你希望拥有技能的角色（如玩家角色）创建一个C++类，并添加一个UAbilitySystemComponent类型的成员变量。

创建属性和属性集：在C++中创建继承自UAttributeSet的类，并在其中定义你的FGameplayAttributeData类型的属性（如生命值、魔法值）。

创建游戏技能（GA）和游戏效果（GE）：这些可以通过蓝图来创建。在蓝图中，你可以设计GA的逻辑（如播放蒙太奇、应用GE），并配置GE如何修改属性（瞬间、周期性或持续性的Buff/Debuff）。

授予并激活技能：在游戏逻辑中（例如玩家出生时），通过ASC的GiveAbility函数将GA授予角色。之后，你可以通过蓝图或C++的TryActivateAbility函数来激活技能。

## 注意事项

正确处理技能生命周期：务必确保技能在完成后能正确结束（End Ability），否则可能导致角色卡死或状态异常。

明确所有权概念：GAS中的“所有者”概念与网络复制中的所有权不同，需要正确理解，尤其是在处理伤害归属、效果来源等逻辑时。

# GAS使用

## 启用GAS插件

在虚幻引擎工具栏-编辑-插件
搜索Gameplay Abilities 勾选并重启引擎

## 设计Gameplay标签系统

GAS配合标签系统，能通过数据配置快速增加新机制，避免繁杂的if，提高开发效率和运行性能

提前根据游戏需要设计相关标签系统
标签系统一般包含：
属性与数值
状态管理
技能和效果
AI行为
UI显示
动画和音效
[跳转GameplayTag描述](/posts/gameplaytag/)

## AttributeSet

### 添加C++类

添加如下c++类
AttributeSet属性集 命名前缀为AS\_。如用于角色的属性集可以为AS_Character。一般需要分别创建AS_Character、AS_NPC、AS_Vehicle（载具），用于给有属性的类使用。

### 声明函数与变量

在属性集中定义变量，例如在继承自UAttributeSet的AS_Character中。由如下代码方式定义，可以通过UPERPERTY对其添加说明符。在定义后需要对变量使用ATTRIBUTE_AXCESSORS宏进行初始化

```cpp
 UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{
	GENERATED_BODY()
	public:
	UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="AS Character",ReplicatedUsing = OnRep_HP)
	FGameplayAttributeData HP;//由两个浮点值组成base value和current value。在#include "AttributeSet.h"中
};

```

注：理论上来说现在的GAS无需手动使用ReplicatedUsing进行网络同步。因为GAS本身就做了一套高效的网络同步机制。

1. 服务器修改HP(BaseValue/CurrentValue)
2. ASC 把属性delta变化通过 GAS 专有网络消息下发客户端
3. 客户端AttributeSet收到，自动更新 HP。
4. GAS 会广播OnAttributeChanged委托，C++/ 蓝图都可以绑定这个委托拿到属性变更，这才是GAS推荐监听属性变化的方式。

在这里是按照本人学习的较老教程进行添加，实际GAS属性变化时其实不一定会触发OnRep

#### 添加ATTRIBUTE_ACCESSORS(ClassName, PropertyName)宏

在继承自UAttributeSet的类中，添加如下宏

```cpp
#define ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)
```

说明
该宏是一个访问器宏函数，宏名称为ATTRIBUTE_ACCESSORS，需要输入一个类名和一个属性名。
该宏会被替换为四个宏。四个宏定义如下

```cpp
#define GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
	static FGameplayAttribute Get##PropertyName##Attribute() \
	{ \
		static FProperty* Prop = FindFieldChecked<FProperty>(ClassName::StaticClass(), GET_MEMBER_NAME_CHECKED(ClassName, PropertyName)); \
		return Prop; \
	}
/*
作用：生成：static FGameplayAttribute GetXXXAttribute()
返回这个属性的元描述对象 FGameplayAttribute

- 静态函数，不需要对象实例就能调用。
- 通过反射查找AttributeSet类里Health这个成员变量的 UProperty。
- 返回的`FGameplayAttribute`是 GAS 系统的身份凭证：GameplayEffect、GameplayModifier、GAS 内部全部都是靠这个函数定位属性。

示例用法：给 GE 传参数 Attribute = UMyAttributeSet::GetHealthAttribute()
*/
#define GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
	FORCEINLINE float Get##PropertyName() const \
	{ \
		return PropertyName.GetCurrentValue(); \
	}
/*
作用：读取属性的【当前值 CurrentValue】

- CurrentValue：经过全部 GameplayEffect 修改之后，游戏运行时看到的最终数值（受 buff/debuff 影响）。
- const 只读，不会修改任何数据。
- 日常游戏逻辑读血量、读攻击力调用这个。

区分：
- GetCurrentValue()：游戏看到的实时数值（buff算完）
- GetBaseValue()：基础值，不受 GE 瞬时修改影响。
*/
#define GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
	FORCEINLINE void Set##PropertyName(float NewVal) \
	{ \
		UAbilitySystemComponent* AbilityComp = GetOwningAbilitySystemComponent(); \
		if (ensure(AbilityComp)) \
		{ \
			AbilityComp->SetNumericAttributeBase(Get##PropertyName##Attribute(), NewVal); \
		}; \
	}
/*
**作用：修改属性的基础值 (BaseValue)，通过 ASC 接口设置

1. 获取所属的UAbilitySystemComponent。
2. 调用AbilityComp->SetNumericAttributeBase(GetHealthAttribute(), NewVal)
3. 修改的是 BaseValue（基础值），会触发 GAS 全部回调、属性更改事件、GameplayEffect 计算。

> ⚠️不要直接写Health.BaseValue = xxx！
> 直接赋值不会通知 ASC，GAS 的回调、复制、GE 全部失效。
> SetXXX () 是正确的 C++ 对外修改属性基础值的入口。
> 注意：这个函数修改的是 BaseValue，不是 CurrentValue；CurrentValue 会由 GAS 基于 BaseValue+GE 自动计算出来。
*/
#define GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName) \
	FORCEINLINE void Init##PropertyName(float NewVal) \
	{ \
		PropertyName.SetBaseValue(NewVal); \
		PropertyName.SetCurrentValue(NewVal); \
	}
/*
作用：初始化属性，同时设置 BaseValue 和 CurrentValue 为同一个值
- 只用于初始化阶段！角色生成、AttributeSet 刚创建的时候设置初始血量。
- 直接修改内部两个值，不走 AbilitySystemComponent，不会触发属性修改委托、不会触发 GameplayEffect**。
- ❌运行游戏过程中不要调用 InitXXX，只用于构造 / 初始化。
如果运行时调用 InitHealth，GE/Buff 会和这个数值发生错乱。
*/
```

#### 对变量初始化

在添加ATTRIBUTE_ACCESSORS(ClassName, PropertyName)宏后，调用并对变量进行初始化。

```cpp
 UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{
	GENERATED_BODY()
	public:
	UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="AS Character",ReplicatedUsing = OnRep_HP)
	FGameplayAttributeData HP;//由两个浮点值组成base value和current value。在#include "AttributeSet.h"中
	ATTRIBUTE_ACCESSORS(UAS_Character,HP)//调用了刚刚创建的宏
};

```

#### 添加OnRep函数

当变量添加了ReplicatedUsing属性后，会自动调用OnRep_XXX()函数。于是需要对这些函数进行定义

```cpp
UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{

	GENERATED_BODY()
	public:
	UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="AS Character",ReplicatedUsing = OnRep_HP)
	FGameplayAttributeData HP;
	ATTRIBUTE_ACCESSORS(UAS_Character,HP)

	UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="AS Character",ReplicatedUsing = OnRep_MAXHP)
	FGameplayAttributeData MAXHP;
	ATTRIBUTE_ACCESSORS(UAS_Character,MAXHP)

	// 网络同步函数
	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
	//virtual是定义虚函数，在ue蓝图中，可以在父类中写一个空函数（也可以非空）。而在其子类中，可以对那个该函数进行函数重载（重写），去进行具体实现，c++中就是使用override对父类的函数进行重载。
	//比如可以在父类中定义了“吃”这个行为的函数。但是具体的子类狗吃什么猫吃什么，也可以到具体的子类中由他们自己去重写实现。
	//const是常量函数，在ue中，const修饰的函数，默认作为纯函数暴露给蓝图，且不能被修改。


	//定义OnRep函数
	//定义OnRep_HP函数
	UFUNCTION()
    void OnRep_HP(const FGameplayAttributeData& OldHP)

	UFUNCTION()
	void OnRep_MAXHP(const FGameplayAttributeData& OldMAXHP)
};
```

当前AS_Character.h文件如下

```cpp
// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "AttributeSet.h"
#include "AbilitySystemComponent.h"
#include "Net/UnrealNetwork.h"//网络相关.h文件
#include "AS_Character.generated.h"


#define ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)

/**
 *
 */
UCLASS()
class REFORGE_API UAS_Character : public UAttributeSet
{

	GENERATED_BODY()
	public:
	UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="AS Character",ReplicatedUsing = OnRep_HP)
	FGameplayAttributeData HP;
	ATTRIBUTE_ACCESSORS(UAS_Character,HP)

	UPROPERTY(EditAnywhere,BlueprintReadWrite,Category="AS Character",ReplicatedUsing = OnRep_MAXHP)
	FGameplayAttributeData MAXHP;
	ATTRIBUTE_ACCESSORS(UAS_Character,MAXHP)

	// 网络同步函数
	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

	//定义OnRep函数
	//定义OnRep_HP函数
	UFUNCTION()
    void OnRep_HP(const FGameplayAttributeData& OldHP)

	UFUNCTION()
	void OnRep_MAXHP(const FGameplayAttributeData& OldMAXHP)

};
```

### 实现函数

来到AS_Character.cpp文件

```cpp
void UAS_Character::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
//void代表这里没有任何返回值。UAS_Character为来自类的名称。
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);
	//Super是指调用父类的函数

	DOREPLIFETIME_CONDITION_NOTIFY(UAS_Character, HP, COND_OwnerOnly, REPNOTIFY_OnRep_HP);
	DOREPLIFETIME_CONDITION_NOTIFY(UAS_Character, MAXHP, COND_OwnerOnly, REPNOTIFY_OnRep_MAXHP);

	//完成复制需要的属性
}

```

#### 实现OnRep函数

```cpp
void UAS_Character::OnRep_HP(const FGameplayAttributeData& OldHP)
{
	GAMEPLAYATTRIBUTE_REPNOTIFY(UAS_Character, HP, OldHP);
}

void UAS_Character::OnRep_MAXHP(const FGameplayAttributeData& OldMAXHP)
{
	GAMEPLAYATTRIBUTE_REPNOTIFY(UAS_Character, MAXHP, OldMAXHP);
}
```

完成后可以按ctrl alt f11编译
