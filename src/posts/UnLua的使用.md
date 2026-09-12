---
title: UnLua的使用
date: 2026-09-01 16:00:47
categories: [UE, Lua]
tags: [UE, Lua]
---

# UnLua使用教程（UE5.8快速上手版）

> 这篇教程写给**以蓝图为主、只了解一点C++基础**的开发者。目标不是讲原理，而是照着步骤把Lua跑起来，并学会蓝图、C++、UnLua三者混合使用。
> 配套仓库：[LanFeng97/UnLua-For-UE5.8](https://github.com/LanFeng97/UnLua-For-UE5.8)

## 一、开始之前你需要知道的三件事

1. **UnLua不是替代蓝图，而是给蓝图/C++补一个Lua逻辑层**。资源、组件、UI、动画这些继续在蓝图或C++里做，逻辑可以写在Lua里。
2. **Lua脚本目录是`Content/Script`**。所有Lua文件都放在这个目录下，用点号`.`表示目录层级。
3. **蓝图类在Lua里的表名要加`_C`后缀**。例如蓝图叫`BP_Hero`，Lua里写`BP_Hero_C`；C++原生类则不加`_C`。

> 名称规则会随UnLua版本略有变化。最稳妥的做法是：**按住`Alt`让UnLua自动生成路径，再点`Create Lua Template`生成模板**，以模板里自动写好的类名和文件位置为准。

## 二、安装插件

1. 由于本文写作时间官方Unlua只更新到了5.6的支持，而5.8版本由于api更新导致无法使用，我用ai做了5.8的适配：[LanFeng97/UnLua-For-UE5.8](https://github.com/LanFeng97/UnLua-For-UE5.8)。
2. 拉取`5.8breach`分支（或Tag`UE5.8_V1.0`）。
3. 把下载下来的`Plugins`里的`UnLua`和`UnLuaExtensions`两个文件夹，复制到你工程的`Plugins`目录下。
4. 重新启动UE编辑器，等待插件编译完成。
5. 验证：菜单栏出现`UnLua`工具栏，说明安装成功。

## 三、三分钟跑通第一个脚本

这里用一个`Actor`蓝图举例，其它类型（GameMode、PlayerController、Widget等）步骤一样。

### 1. 新建蓝图并添加接口

- 新建一个`Actor`蓝图，命名为`BP_HelloActor`，双击打开。
- 点击`Class Settings`（类设置）→ `Interfaces`（接口）→ `Add`，搜索并添加`UnLuaInterface`。

### 2. 绑定Lua模块

- 点击菜单栏`UnLua`工具栏里的`Bind`（绑定）。
- 左侧`Interfaces`下会出现`GetModuleName`函数，双击打开，在`Return Value`里填入Lua模块路径，例如：

```text
Hello.BP_HelloActor
```

路径规则：相对`Content/Script`，用点号`.`分隔。上面这个值对应的Lua文件是：

```text
Content/Script/Hello/BP_HelloActor.lua
```

> 小技巧：**按住`Alt`再点`Bind`**，UnLua会根据蓝图资源路径自动填充模块路径，新手直接用它自动生成的值最省心。

### 3. 生成Lua模板

- 点击`UnLua`工具栏里的`Create Lua Template`（创建Lua模板）。
- 用系统文件管理器打开`Content/Script/Hello/BP_HelloActor.lua`（内容浏览器里看不到Lua脚本）。
- 模板通常已经生成好类定义，保留它的第一行，把示例逻辑加进去即可。参考如下：

```lua
local BP_HelloActor_C = Class()

function BP_HelloActor_C:Initialize()
    -- 任意对象绑定到Lua时都会调用一次，可留空
end

function BP_HelloActor_C:ReceiveBeginPlay()
    print("Hello, UnLua!")
    print("当前Actor名字：" .. self:GetName())
end

return BP_HelloActor_C
```

### 4. 编译保存并运行

- 回到蓝图，依次点`Compile`（编译）和`Save`（保存）。
- 把`BP_HelloActor`拖进场景，点`Play`运行。
- 打开`Output Log`（输出日志），搜索`Hello`，能看到两行打印就成功了。

到这里，你已经完成了"给蓝图绑定Lua，并用Lua覆盖蓝图事件"的完整流程。

## 四、蓝图 + UnLua 混合使用

这是你最常用的一种组合。记住一个分工：

- **蓝图负责**：组件、资源引用、变量、UI控件、动画、材质等"看得见"的东西。
- **Lua负责**：事件响应、流程控制、数值计算等"逻辑"。

下面这些函数，都写在你模板文件里`return`之前对应的类表上。

### 1. Lua读取蓝图变量

在蓝图里建一个`Integer`变量`ExtraScore`，默认值填`5`。Lua里直接用`self.变量名`读取：

```lua
function BP_HelloActor_C:ReceiveBeginPlay()
    print("额外分数：" .. self.ExtraScore)
end
```

### 2. Lua调用蓝图函数

在蓝图里建一个函数`GetBaseScore`，返回`100`。Lua里这样调用：

```lua
function BP_HelloActor_C:ReceiveBeginPlay()
    local Base = self:GetBaseScore()
    print("基础分数：" .. Base)
end
```

### 3. Lua覆盖蓝图事件

在蓝图里定义一个事件`OnDamage`，类型选`BlueprintImplementableEvent`（蓝图可实现的纯蓝图事件）。Lua里写同名函数即可覆盖它：

```lua
function BP_HelloActor_C:OnDamage(Value)
    print("受到伤害：" .. Value)
end
```

当蓝图其它节点调用`OnDamage`时，执行的其实是Lua里的这段逻辑。**这就是"蓝图调用Lua"的典型方式**：蓝图负责触发时机，Lua负责具体实现。

### 4. 覆盖后还想保留原蓝图逻辑：用Overridden

如果你在蓝图的事件图里也写了`ReceiveBeginPlay`逻辑，同时Lua又覆盖了它，默认Lua会**完全替换**蓝图实现。想先执行蓝图原逻辑，再执行Lua逻辑，用`self.Overridden`：

```lua
function BP_HelloActor_C:ReceiveBeginPlay()
    -- 先调用蓝图里原来的ReceiveBeginPlay实现
    self.Overridden.ReceiveBeginPlay(self)

    -- 再执行Lua自己的逻辑
    print("这是Lua追加的逻辑")
end
```

### 5. 蓝图提供UI，Lua控制UI

这是最实用的组合之一：在蓝图中创建并绑定`UserWidget`控件，Lua里加载并操作它：

```lua
function BP_HelloActor_C:ReceiveBeginPlay()
    -- 加载蓝图类型的Widget，再创建出来
    local WidgetClass = UE.UClass.Load("/Game/UI/WBP_Main.WBP_Main_C")
    local Widget = UE.UWidgetBlueprintLibrary.Create(self, WidgetClass)
    Widget:AddToViewport(0)
end
```

## 五、C++ + UnLua 混合使用

你只有一点C++基础没关系，先理解两个方向即可：

1. **C++写"能力"，Lua调用它**（最常见，也最推荐）。
2. **C++主动调用Lua函数**（用于需要从C++侧触发脚本的场景）。

### 方向一：C++暴露函数和属性给Lua

C++类用`UFUNCTION`、`UPROPERTY`暴露的成员，Lua能直接访问，几乎不需要额外胶水代码。

`MyActorBase.h`：

```cpp
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MyActorBase.generated.h"

UCLASS()
class MYGAME_API AMyActorBase : public AActor
{
    GENERATED_BODY()

public:
    AMyActorBase();

    // BlueprintCallable：蓝图和Lua都能调用
    UFUNCTION(BlueprintCallable, Category = "MyActor")
    int32 Add(int32 A, int32 B);

    // BlueprintReadWrite：蓝图和Lua都能读写
    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "MyActor")
    int32 BaseScore = 10;
};
```

`MyActorBase.cpp`：

```cpp
#include "MyActorBase.h"

AMyActorBase::AMyActorBase()
{
    PrimaryActorTick.bCanEverTick = false;
}

int32 AMyActorBase::Add(int32 A, int32 B)
{
    return A + B;
}
```

然后在Lua里调用：

```lua
function BP_MyActor_C:ReceiveBeginPlay()
    -- 调用C++暴露的函数（self就是当前Actor）
    local Sum = self:Add(self.BaseScore, 20)

    print("C++计算的结果：" .. Sum)
end
```

### 方向二：C++调用Lua函数

C++侧通过`UnLua::GetState()`拿到Lua状态，再用`UnLua::Call`或`UnLua::CallTableFunc`调用。

```cpp
#include "UnLua.h"

void AMyGameMode::CallLuaLogic()
{
    // 拿到全局Lua状态
    lua_State* L = UnLua::GetState();
    if (!L)
    {
        return;
    }

    // 调用全局函数 OnGameStart(100)
    UnLua::Call(L, "OnGameStart", 100);

    // 调用全局表 GameLogic 里的 OnScoreChanged(200)
    UnLua::CallTableFunc(L, "GameLogic", "OnScoreChanged", 200);
}
```

对应Lua侧：

```lua
function OnGameStart(Value)
    print("游戏开始，参数：" .. Value)
end

GameLogic = {}
function GameLogic:OnScoreChanged(Value)
    print("分数变化：" .. Value)
end
```

> 注意：不同版本里获取Lua状态的函数名可能不同（旧版叫`GetState`，部分新封装可能叫`GetMainState`）。如果编译报错，去你拉取的`Plugins/UnLua/Source/UnLua/Public/`目录里找`LuaEnv.h`或`UnLua.h`，以里面的真实函数名为准。

### 补充：C++类静态绑定到Lua

想让C++类被Lua覆盖事件，让C++类实现`IUnLuaInterface`接口，并返回Lua模块路径：

```cpp
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "UnLuaInterface.h"
#include "MyGameMode.generated.h"

UCLASS()
class MYGAME_API AMyGameMode : public AGameModeBase, public IUnLuaInterface
{
    GENERATED_BODY()

public:
    virtual FString GetModuleName_Implementation() const override
    {
        return TEXT("GameModes.MyGameMode");
    }
};
```

对应的Lua文件为`Content/Script/GameModes/MyGameMode.lua`，表名写`MyGameMode`（C++原生类不加`_C`）：

```lua
local MyGameMode = Class()

function MyGameMode:ReceiveBeginPlay()
    print("GameMode的BeginPlay被Lua接管了")
end

return MyGameMode
```

## 六、蓝图 + C++ + UnLua 三位混合使用

这是完整的推荐链路。用一个"计分Actor"做最小例子：

- **C++**：提供`BaseScore`属性和`Add()`函数（可复用、性能敏感的部分）。
- **蓝图**：继承C++类，拖一个`StaticMesh`组件，再加一个蓝图变量`ExtraScore`（资源配置、美术表现）。
- **Lua**：覆盖`ReceiveBeginPlay`，把C++和蓝图的东西组合成最终逻辑。

### 1. C++基类（同第五节）

`AMyActorBase`已经有`BaseScore`和`Add()`，不再重复。

### 2. 蓝图子类

- 新建蓝图`BP_MyActor`，父类选`AMyActorBase`。
- 添加一个`Integer`变量`ExtraScore`，默认值`5`。
- 添加接口`UnLuaInterface`，`GetModuleName`填入`Gameplay.BP_MyActor`。

### 3. Lua逻辑

`Content/Script/Gameplay/BP_MyActor.lua`：

```lua
local BP_MyActor_C = Class()

function BP_MyActor_C:ReceiveBeginPlay()
    -- 1. 调用C++暴露的函数，并使用C++暴露的属性
    local Sum = self:Add(self.BaseScore, 20)

    -- 2. 读取蓝图里配置的变量
    local Total = Sum + self.ExtraScore

    -- 3. 输出最终结果
    print("最终得分：" .. Total)
end

return BP_MyActor_C
```

运行后，`Total`应该等于`10 + 20 + 5 = 35`。这个例子完整走通了"蓝图提供配置、C++提供能力、Lua编排逻辑"的分工。

## 七、常用速查表

### 1. 用UE.访问引擎类型

`UE`是全局对象，按需懒加载，几乎能访问所有反射类型：

```lua
-- USTRUCT
local Position = UE.FVector()
Position.X = 256.0

-- UENUM
print(UE.EAttachmentRule.SnapToTarget)

-- 加载蓝图类并创建Widget
local WidgetClass = UE.UClass.Load("/Game/UI/WBP_Main.WBP_Main_C")
local Widget = UE.UWidgetBlueprintLibrary.Create(self, WidgetClass)
```

### 2. 覆盖蓝图事件

Lua里写与蓝图事件同名的函数即可。常见事件：

```lua
function BP_HelloActor_C:ReceiveBeginPlay()
    -- 游戏开始时执行
end

function BP_HelloActor_C:ReceiveTick(DeltaSeconds)
    -- 每帧执行
end
```

### 3. 用协程调用延迟函数

`Delay`这类Latent函数要在Lua协程里调用：

```lua
coroutine.resume(coroutine.create(function(GameMode, Duration)
    UE.UKismetSystemLibrary.Delay(GameMode, Duration)
    print("5秒后执行")
end), self, 5.0)
```

### 4. 定时器委托

```lua
-- 每隔1秒执行一次OnTimer
UE.UKismetSystemLibrary.K2_SetTimerDelegate({ self, self.OnTimer }, 1.0, true)
```

### 5. 输出日志

```lua
print("普通打印")
UE.UKismetSystemLibrary.PrintString(self, "屏幕上显示", true, true, UE.FLinearColor(0, 1, 0, 1), 2.0)
```

### 6. 防止对象被回收

UnLua2.2起，Lua默认不再强引用UObject。如果Lua里要长期持有某个对象，用`UnLua.Ref`：

```lua
local MyClass = UE.UClass.Load("/Game/MyClass")
RefProxy = UnLua.Ref(MyClass)   -- 持有引用

-- 不再需要时
RefProxy = nil                   -- 释放引用
```

## 八、官方文档导航

遇到问题优先查这些文档，比看二手资料准确：

- [功能清单](https://github.com/Tencent/UnLua/blob/master/Docs/CN/Features.md)：更详细的功能列表
- [编程指南](https://github.com/Tencent/UnLua/blob/master/Docs/CN/UnLua_Programming_Guide.md)：主要功能和编程模式
- [API](https://github.com/Tencent/UnLua/blob/master/Docs/CN/API.md)：C++和Lua两侧API说明
- [插件与模块](https://github.com/Tencent/UnLua/blob/master/Docs/CN/Plugins_And_Modules.md)：Plugins目录插件列表
- [设置选项](https://github.com/Tencent/UnLua/blob/master/Docs/CN/Settings.md)：热重载、类型检查等开关
- [调试](https://github.com/Tencent/UnLua/blob/master/Docs/CN/Debugging.md)：Lua调试方法
- [智能提示](https://github.com/Tencent/UnLua/blob/master/Docs/CN/IntelliSense.md)：给Lua生成智能提示
- [控制台命令](https://github.com/Tencent/UnLua/blob/master/Docs/CN/ConsoleCommand.md)：UnLua相关控制台命令
- [FAQ](https://github.com/Tencent/UnLua/blob/master/Docs/CN/FAQ.md)：常见问题
- [实现原理](https://github.com/Tencent/UnLua/blob/master/Docs/CN/How_To_Implement_Overriding.md)：两种覆盖机制（想深入再读）