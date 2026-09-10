---
title: Advanced Sessions Plugin使用文档
date: 2026-09-10 15:05:50
categories: [UE]
tags: [UE,客户端网络开发]
---
# Advanced Sessions Plugin使用文档

> 本文件以https://github.com/LanFeng97/Chinese-AdvancedSessionsPlugin仓库 UE 5.8 上游签名（当前 `master` 分支）为准；中文汉化分支的蓝图节点显示名采用“中文 (English)”双语形式，可直接用中文或英文搜索。不同 UE 版本分支的部分参数存在增删，遇到差异时以对应分支 README 和节点为准。

---

## 1. 插件概述

本插件包含两个可独立启用的模块：

| 模块 | 作用 | 依赖 |
|---|---|---|
| `AdvancedSessions` | 高级会话创建、查找、更新、结束；好友、登录身份、语音、外部 UI、会话信息、玩家 ID、ServerTravel 等蓝图函数与 C++ API | `OnlineSubsystem`、`OnlineSubsystemUtils` |
| `AdvancedSteamSessions` | Steam 专属扩展：好友头像与资料、Steam 群组、创意工坊、文本过滤、Steam 悬浮层、Steam 通知事件 | `AdvancedSessions`、`OnlineSubsystemSteam`、`SteamShared`、`Steamworks` |

核心使用流程为：

```text
主机：CreateAdvancedSession ->（可选 StartAdvancedSession）-> 加载 listen 地图
客户端：FindSessionsAdvanced -> Join Session -> 自动 ClientTravel
```

`Join Session` 与 `Destroy Session` 属于引擎自带节点，插件负责补齐高级参数、搜索过滤、好友邀请、身份、语音和 Steam 能力。

---

## 2. 安装与启用

### 2.1 放置插件

将对应版本分支中的目录复制到项目目录下：

```text
<Project>/Plugins/AdvancedSessions/
<Project>/Plugins/AdvancedSteamSessions/   # 仅 Steam 功能需要
```

也可以放置到引擎的 `Engine/Plugins/`，但推荐项目级插件。

### 2.2 启用插件

在编辑器菜单中执行 **Edit > Plugins**，搜索 `Advanced Sessions` 与 `Advanced Steam Sessions`，勾选启用后重启编辑器。启用状态会写入 `.uproject` 文件。

只使用基础会话、好友、语音和外部 UI 时，仅启用 `AdvancedSessions`；使用 Steam 头像、群组、创意工坊等能力时，同时启用 `AdvancedSteamSessions`。

### 2.3 在线子系统配置

#### Steam（推荐用于正式联机）

在项目的 `Config/DefaultEngine.ini` 中写入：

```ini
[OnlineSubsystem]
DefaultPlatformService=Steam

[OnlineSubsystemSteam]
bEnabled=true
SteamDevAppId=480
```

`SteamDevAppId` 在开发阶段可填 `480`（Steam 官方测试游戏 Spacewar）；正式发布时替换为项目自己的 AppID，并正确配置 Steamworks 设置。

#### 纯局域网测试

纯局域网测试通常无需修改在线子系统配置，只需在创建和搜索会话时把 `bUseLAN` 设为 `true`，主机加载地图时使用 `?listen` 选项。若不指定 Steam，则使用引擎默认的本地在线子系统。

### 2.4 C++ 模块依赖

在项目模块的 `*.Build.cs` 中增加依赖：

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
    "Core",
    "CoreUObject",
    "Engine",
    "InputCore",
    "OnlineSubsystem",
    "OnlineSubsystemUtils",
    "AdvancedSessions"
});
```

使用 Steam 扩展时再增加：

```csharp
PrivateDependencyModuleNames.AddRange(new string[] {
    "AdvancedSteamSessions",
    "OnlineSubsystemSteam",
    "SteamShared",
    "Steamworks"
});
```

常用 C++ 头文件：

```cpp
#include "AdvancedSessionsLibrary.h"
#include "CreateSessionCallbackProxyAdvanced.h"
#include "FindSessionsCallbackProxyAdvanced.h"
#include "StartSessionCallbackProxyAdvanced.h"
#include "UpdateSessionCallbackProxyAdvanced.h"
#include "EndSessionCallbackProxy.h"
#include "CancelFindSessionsCallbackProxy.h"
#include "FindFriendSessionCallbackProxy.h"
#include "AdvancedFriendsLibrary.h"
#include "AdvancedFriendsGameInstance.h"
#include "AdvancedFriendsInterface.h"
#include "AdvancedIdentityLibrary.h"
#include "AdvancedVoiceLibrary.h"
#include "AdvancedExternalUILibrary.h"
#include "AdvancedSteamFriendsLibrary.h"
#include "AdvancedSteamWorkshopLibrary.h"
```

---

## 3. 基本概念与数据类型

### 3.1 会话模型

| 概念 | 说明 |
|---|---|
| `Listen Server` | 由一名玩家同时充当主机和玩家。创建会话时 `bIsDedicatedServer=false`，加载地图时带 `?listen`。 |
| `Dedicated Server` | 无本地玩家的专用服务器。创建时 `bIsDedicatedServer=true`、`bUsePresence=false`（5.8 中由 `bUseLobbiesIfAvailable=false` 控制），不依赖 Presence。 |
| `PublicConnections` | 公开连接数。Listen Server 自己占 1 个连接，计划再进 3 名玩家时填 `4`。 |
| `PrivateConnections` | 私密连接数，一般填 `0`。 |
| `bShouldAdvertise` | 是否在搜索结果中公开该房间。`false` 时只能通过邀请加入。 |
| `bUseLAN` | 是否搜索局域网。主机与客户端必须保持一致。 |
| `bAllowInvites` | 是否允许邀请。 |
| `bAllowJoinViaPresence` | 是否允许通过 Presence（好友在线状态）加入。 |
| `bAllowJoinInProgress` | 是否允许会话进行中加入。 |
| `Presence` | 平台在线状态。Listen Server 通常启用；专用服务器不使用。 |

### 3.2 常用结构体与枚举

| 名称 | 用途 |
|---|---|
| `FBlueprintSessionResult` | 搜索结果中的单个会话，用于 `Join Session` 或 C++ 加入流程。 |
| `FSessionPropertyKeyPair` | 自定义会话属性，键为 `FName`，值为 `FVariantData`。 |
| `FSessionsSearchSetting` | 搜索过滤条件，由属性键值对和比较运算符组成。 |
| `FBPUniqueNetId` | 蓝图可用的玩家唯一 ID。 |
| `FBPFriendInfo` | 好友信息：显示名、真实名、在线状态、唯一 ID、是否正在玩本游戏、Presence 信息。 |
| `FBPOnlineRecentPlayer` | 最近一起游戏的玩家。 |
| `EBlueprintResultSwitch` | `OnSuccess` / `OnFailure` 两个执行分支，用于蓝图中拆分输出。 |
| `EBlueprintAsyncResultSwitch` | `OnSuccess` / `AsyncLoading` / `OnFailure`，用于头像等异步结果。 |
| `EBPServerPresenceSearchType` | `AllServers` / `ClientServersOnly` / `DedicatedServersOnly`。 |
| `EBPOnlineSessionState` | `NoSession`、`Creating`、`Pending`、`Starting`、`InProgress`、`Ending`、`Ended`、`Destroying`。 |
| `EBPOnlinePresenceState` | `Online`、`Offline`、`Away`、`ExtendedAway`、`DoNotDisturb`、`Chat`。 |
| `EOnlineComparisonOpRedux` | `Equals`、`NotEquals`、`GreaterThan`、`GreaterThanEquals`、`LessThan`、`LessThanEquals`。 |
| `ESessionSettingSearchResult` | 读取自定义属性时的结果：`Found`、`NotFound`、`WrongType`。 |

### 3.3 自定义会话属性与过滤

主机在创建会话时传入 `ExtraSettings`，例如写入 `GameMode=1`：

```cpp
TArray<FSessionPropertyKeyPair> ExtraSettings;
ExtraSettings.Add(UAdvancedSessionsLibrary::MakeLiteralSessionPropertyInt(TEXT("GameMode"), 1));
```

客户端在 `FindSessionsAdvanced` 中传入 `Filters`，只返回满足条件的房间：

```cpp
FSessionsSearchSetting Filter;
Filter.PropertyKeyPair = UAdvancedSessionsLibrary::MakeLiteralSessionPropertyInt(TEXT("GameMode"), 1);
Filter.ComparisonOp = EOnlineComparisonOpRedux::Equals;
TArray<FSessionsSearchSetting> Filters = { Filter };
```

蓝图中对应节点为 **Make Literal Session Property Int**、**Make Literal Session Property String**、**Make Literal Session Property Bool**、**Make Literal Session Property Float**、**Make Literal Session Property Byte**，以及 **Make Literal Session Search Property**。

---

## 4. 蓝图使用方式

### 4.1 节点搜索

蓝图右键菜单中可直接搜索以下英文名；汉化分支同时支持中文显示名搜索：

- 会话：`Create Advanced Session`、`Find Sessions Advanced`、`Start Advanced Session`、`Update Session`、`End Session`、`Cancel Find Sessions`
- 好友：`Find Friend Session`、`Get And Store Friends List`、`Send Session Invite To Friend` 等
- 身份：`Login User`、`Logout User`、`Auto Login User`、`Get Login Status` 等
- 语音：`Start Networked Voice`、`Stop Networked Voice`、`Mute Remote Talker` 等
- 外部 UI：`Show Friends UI`、`Show Invite UI`、`Show Profile UI`、`Show Web URL UI` 等
- Steam：`Get Steam Friend Avatar`、`Request Steam Friend Info`、`Get Steam Groups`、`Get Subscribed Workshop Items` 等

### 4.2 核心会话流程

> 说明：本插件中带 `WorldContext="WorldContextObject"` 元数据的节点（例如 `Create Advanced Session`、`Find Sessions Advanced`）在蓝图里不显示 `World Context Object` 引脚，蓝图会按当前蓝图自动确定世界上下文。该参数只在纯 C++ 调用时需要传入，例如 `GetWorld()` 或 `GetGameInstance()`。

#### 创建高级会话 `Create Advanced Session`

蓝图节点对应函数：

```text
CreateAdvancedSession(
    WorldContextObject,
    ExtraSettings,
    PlayerController,
    PublicConnections,
    PrivateConnections,
    bUseLAN,
    bAllowInvites,
    bIsDedicatedServer,
    bUseLobbiesIfAvailable,
    bAllowJoinViaPresence,
    bAllowJoinViaPresenceFriendsOnly,
    bAntiCheatProtected,
    bUsesStats,
    bShouldAdvertise,
    bUseLobbiesVoiceChatIfAvailable,
    bStartAfterCreate)
```

关键引脚：

| 引脚 | 推荐值 | 说明 |
|---|---|---|
| `Player Controller` | `Get Player Controller 0` | 非专用服务器需要有效本地玩家 |
| `Extra Settings` | 空数组或自定义属性数组 | 房间自定义键值对 |
| `Public Connections` | 4 | Listen Server 自身占 1 |
| `Private Connections` | 0 | 一般不用私密连接 |
| `Use LAN` | 与搜索端一致 | 局域网填 `true`，Steam 填 `false` |
| `Allow Invites` | `true` | 允许邀请加入 |
| `Is Dedicated Server` | `false` | 专用服务器填 `true` |
| `Use Lobbies If Available` | Steam Listen Server 填 `true`，LAN 填 `false` | 5.8 中用于控制是否使用大厅与 Presence |
| `Allow Join Via Presence` | `true` | 允许通过好友在线状态加入 |
| `Allow Join Via Presence Friends Only` | `false` | 仅限好友时填 `true` |
| `Anti Cheat Protected` | `false` | 是否启用反作弊标记 |
| `Uses Stats` | `false` | 是否记录统计 |
| `Should Advertise` | `true` | `false` 时只能通过邀请加入 |
| `Use Lobbies Voice Chat If Available` | `false` | 是否使用大厅语音 |
| `Start After Create` | `true` | `false` 时后续手动调用 `Start Advanced Session` |

输出执行引脚：

- `On Success`：会话创建（并按 `Start After Create` 自动启动）成功。
- `On Failure`：创建失败。

> 创建成功并不等于自动进入游戏地图。主机仍需在 `On Success` 后跳转到目标地图并带 `?listen` 参数。

#### 开始会话 `Start Advanced Session`

当创建时 `Start After Create=false`，准备完成后调用此节点启动会话。输出为 `On Success` / `On Failure`。

#### 查找会话 `Find Sessions Advanced`

节点函数：

```text
FindSessionsAdvanced(
    WorldContextObject,
    PlayerController,
    MaxResults,
    bUseLAN,
    ServerTypeToSearch,
    Filters,
    bEmptyServersOnly,
    bNonEmptyServersOnly,
    bSecureServersOnly,
    MinSlotsAvailable)
```

关键引脚：

| 引脚 | 推荐值 | 说明 |
|---|---|---|
| `Player Controller` | `Get Player Controller 0` | 本地玩家 |
| `Max Results` | 20 | 最多返回数量 |
| `Use LAN` | 与主机一致 | 局域网填 `true` |
| `Server Type To Search` | `All Servers` | 可选 `Client Servers Only`、`Dedicated Servers Only` |
| `Filters` | 空数组或 `FSessionsSearchSetting` 数组 | 自定义过滤 |
| `Empty Servers Only` | `false` | 只搜空房间时填 `true` |
| `Non Empty Servers Only` | `false` | 只搜非空房间时填 `true` |
| `Secure Servers Only` | `false` | 只搜安全服务器时填 `true` |
| `Min Slots Available` | 1 | 最少可用槽位 |

输出：

- `On Success`：返回 `Results`（`FBlueprintSessionResult` 数组）。
- `On Failure`：返回空数组或失败结果。

拿到 `Results` 后，取出一个 `FBlueprintSessionResult`，连接到引擎自带的 **Join Session** 节点即可加入。引擎 `Join Session` 节点通常会自动执行 `ClientTravel`。

#### 更新会话 `Update Session`

已创建会话后，可修改房间人数、广播状态、加入策略和自定义属性：

```text
UpdateSession(
    WorldContextObject,
    ExtraSettings,
    PublicConnections,
    PrivateConnections,
    bUseLAN,
    bAllowInvites,
    bAllowJoinInProgress,
    bRefreshOnlineData,
    bIsDedicatedServer,
    bShouldAdvertise,
    bAllowJoinViaPresence,
    bAllowJoinViaPresenceFriendsOnly)
```

注意：该节点参数较多，修改时建议显式传入所有需要保持的值，避免默认值覆盖预期设置。

#### 结束与取消

- **End Session**：结束当前会话，属于旧接口；官方建议大多数情况使用引擎自带的 **Destroy Session** 销毁会话。
- **Cancel Find Sessions**：中止正在进行的搜索。

### 4.3 会话信息与自定义属性

| 节点（英文） | 用途 |
|---|---|
| `Is Valid Session` | 判断搜索结果是否有效 |
| `Get Session ID As String` | 获取某个搜索结果的会话 ID 字符串 |
| `Get Current Session ID As String` | 获取当前会话 ID 字符串 |
| `Get Current Unique Build ID` | 获取当前构建唯一 ID |
| `Get Unique Build ID` | 获取某个搜索结果的构建 ID |
| `Get Session State` | 获取当前会话状态 |
| `Get Session Settings` | 一次读取连接数、LAN、专用服务器、邀请、进行中加入、反作弊、构建 ID、额外属性等 |
| `Get Extra Settings` | 获取搜索结果中的额外属性数组 |
| `Add Or Modify Extra Settings` | 合并或覆盖额外属性数组 |
| `Find Session Property By Name` | 按名称查找属性，返回 `OnSuccess`/`OnFailure` |
| `Find Session Property Index By Name` | 按名称查找属性索引 |
| `Get Session Property Int/Float/Bool/String/Byte` | 按名称和类型读取属性值，输出 `Found`/`NotFound`/`WrongType` |
| `Make Literal Session Property Int/Float/Bool/String/Byte` | 构造属性键值对 |
| `Make Literal Session Search Property` | 构造搜索过滤条件 |
| `Is Player In Session` | 判断指定玩家是否在当前会话中 |

### 4.4 好友、最近玩家与邀请

| 节点（英文） | 用途 |
|---|---|
| `Get And Store Friends List` | 异步获取并缓存好友列表，成功后可用 `Get Stored Friends List` 读取 |
| `Get Stored Friends List` | 读取已缓存的好友列表 |
| `Get Friend` | 按唯一 ID 读取某个好友信息 |
| `Is A Friend` | 判断指定 ID 是否为好友 |
| `Get And Store Recent Players List` | 异步获取并缓存最近一起游戏的玩家 |
| `Get Stored Recent Players List` | 读取已缓存的最近玩家 |
| `Send Session Invite To Friend` | 邀请单个好友加入当前会话 |
| `Send Session Invite To Friends` | 邀请一组好友加入当前会话 |
| `Send Friend Invite` | 发送平台好友申请；Steam 等部分平台不支持 |
| `Find Friend Session` | 异步查找某好友所在会话，返回 `SessionInfo` 数组，可配合 `Join Session` 使用 |

邀请类节点的典型流程：

```text
Get Stored Friends List -> 从数组取一个 FBPFriendInfo -> 取 UniqueNetId
-> Send Session Invite To Friend -> OnSuccess
```

### 4.5 登录、身份与账号

| 节点（英文） | 用途 |
|---|---|
| `Login User` | 使用 UserID、UserToken、AuthType 登录 |
| `Logout User` | 登出 |
| `Auto Login User` | 使用命令行参数 `-AUTH_LOGIN=` 与 `-AUTH_PASSWORD=` 自动登录，常用于专用服务器 |
| `Get Login Status` | 获取登录状态，输出 `EBPLoginStatus` 和成功/失败分支 |
| `Get Player Auth Token` | 获取玩家认证令牌 |
| `Get Player Nickname` | 获取玩家昵称 |
| `Get User Account` | 获取单个用户账号 |
| `Get All User Accounts` | 获取全部用户账号 |
| `Get User Account Access Token` | 获取账号访问令牌 |
| `Get User Account Auth Attribute` | 读取认证属性 |
| `Set User Account Attribute` | 设置账号属性 |
| `Get User Account Attribute` | 读取账号属性 |
| `Get User Account Real Name` | 获取真实姓名 |
| `Get User Account Display Name` | 获取显示名 |
| `Get User ID` | 从账号信息取得唯一 ID |
| `Get User Privilege` | 检查指定权限，输出 `QueriedPrivilege` 与 `HadPrivilege` |

### 4.6 语音

| 节点（英文） | 用途 |
|---|---|
| `Is Headset Present` | 检测耳机是否就绪 |
| `Start Networked Voice` / `Stop Networked Voice` | 开始/停止网络语音，可用于按键说话 |
| `Register Local Talker` / `Register All Local Talkers` | 注册本地讲话者 |
| `UnRegister Local Talker` / `UnRegister All Local Talkers` | 注销本地讲话者 |
| `Register Remote Talker` / `UnRegister Remote Talker` | 注册/注销远程讲话者 |
| `Remove All Remote Talkers` | 移除全部远程讲话者 |
| `Is Local Player Talking` / `Is Remote Player Talking` | 判断本地/远程玩家是否正在说话 |
| `Is Player Muted` | 判断玩家是否被静音 |
| `Mute Remote Talker` / `UnMute Remote Talker` | 静音/取消静音远程讲话者，`bIsSystemWide=true` 时尝试全局静音 |

### 4.7 外部 UI

| 节点（英文） | 用途 |
|---|---|
| `Show Friends UI` | 显示平台好友界面 |
| `Show Invite UI` | 显示平台邀请界面 |
| `Show Profile UI` | 显示玩家资料界面 |
| `Show Web URL UI` / `Close Web URL UI` | 显示/关闭网页 URL 界面 |
| `Show Leader Board UI` | 显示排行榜界面；Steam 上不可用 |
| `Show Account Upgrade UI` | 显示账号升级界面；Steam 上不可用 |

### 4.8 Steam 扩展（仅 Steam 在线子系统）

| 节点（英文） | 用途 |
|---|---|
| `Request Steam Friend Info` | 预加载好友名称或头像，返回是否已可用 |
| `Get Steam Friend Avatar` | 获取好友头像，输出 `UTexture2D*`，结果分支为 `OnSuccess`/`AsyncLoading`/`OnFailure` |
| `Get Steam Persona Name` | 获取 Steam 个人资料名 |
| `Get Friend Steam Level` | 获取好友 Steam 等级，未知时返回 `-1` |
| `Get Local Steam ID From Steam` | 获取本地 Steam ID |
| `Create Steam ID From String` | 从 64 位字符串构造 Steam ID |
| `Get Steam Friend Game Played` | 获取好友正在玩的游戏 AppID |
| `Open Steam User Overlay` | 打开指定用户的 Steam 悬浮层，`DialogType` 可为 `steamid`、`chat`、`jointrade`、`stats`、`achievements` 等 |
| `Is Overlay Enabled` | 判断 Steam 悬浮层是否启用 |
| `Is Steam In Big Picture Mode` | 判断是否处于大屏幕模式 |
| `Get Steam Groups` | 获取 Steam 群组列表 |
| `Get Steam Group Officer List` | 异步获取群组管理员列表 |
| `Init Text Filtering` | 初始化 Steam 文本过滤词典 |
| `Filter Text` | 按上下文过滤文本，使用前需先初始化 |
| `Get Subscribed Workshop Items` | 获取已订阅创意工坊物品 ID 列表 |
| `Get Num Subscribed Workshop Items` | 获取已订阅物品数量 |
| `Get Workshop Item Details` | 异步获取创意工坊物品详情 |

Steam 通知事件：`USteamNotificationsSubsystem` 提供 `OnSteamOverlayActivated_Bind` 事件，在 Steam 悬浮层状态切换时广播布尔值。

---

---

## 5. 纯 C++ 使用方式

### 5.1 总体模式

插件中带 `BlueprintInternalUseOnly` 的静态工厂函数（如 `CreateAdvancedSession`、`FindSessionsAdvanced`、`UpdateSession`、`LoginUser` 等）返回一个异步代理对象。C++ 中使用流程为：

```text
保存代理对象 -> 绑定 OnSuccess/OnFailure -> 调用 Activate() -> 在回调中处理结果
```

代理对象必须使用 `UPROPERTY()` 成员持有，避免在异步完成前被垃圾回收。同步蓝图函数库函数（如 `KickPlayer`、`GetSessionState`、`MakeLiteralSessionPropertyInt`）可直接调用。

### 5.2 创建会话

```cpp
#include "CreateSessionCallbackProxyAdvanced.h"
#include "AdvancedSessionsLibrary.h"

// 类成员
UPROPERTY()
TObjectPtr<UCreateSessionCallbackProxyAdvanced> CreateProxy;

UFUNCTION()
void HandleHostSuccess();

UFUNCTION()
void HandleHostFailure();

void HostSteamGame()
{
    if (CreateProxy)
    {
        return;
    }

    TArray<FSessionPropertyKeyPair> ExtraSettings;
    ExtraSettings.Add(UAdvancedSessionsLibrary::MakeLiteralSessionPropertyInt(TEXT("GameMode"), 1));

    CreateProxy = UCreateSessionCallbackProxyAdvanced::CreateAdvancedSession(
        GetWorld(),     // WorldContextObject
        ExtraSettings,
        this,           // PlayerController：Listen Server 需要有效本地玩家
        4,              // PublicConnections
        0,              // PrivateConnections
        false,          // bUseLAN：Steam 填 false，局域网填 true
        true,           // bAllowInvites
        false,          // bIsDedicatedServer
        true,           // bUseLobbiesIfAvailable：Steam Listen Server 填 true
        true,           // bAllowJoinViaPresence
        false,          // bAllowJoinViaPresenceFriendsOnly
        false,          // bAntiCheatProtected
        false,          // bUsesStats
        true,           // bShouldAdvertise
        false,          // bUseLobbiesVoiceChatIfAvailable
        true);          // bStartAfterCreate

    if (!CreateProxy)
    {
        return;
    }

    CreateProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleHostSuccess);
    CreateProxy->OnFailure.AddDynamic(this, &ThisClass::HandleHostFailure);
    CreateProxy->Activate();
}
```

> 在 `APlayerController` 或 `AActor` 子类中，`GetWorld()` 可直接作为世界上下文对象。若在 `UGameInstance` 子类中调用，注意 `GetWorld()` 在无世界阶段可能为空。

### 5.3 查找会话

```cpp
#include "FindSessionsCallbackProxyAdvanced.h"

UPROPERTY()
TObjectPtr<UFindSessionsCallbackProxyAdvanced> FindProxy;

UFUNCTION()
void HandleFindSuccess(const TArray<FBlueprintSessionResult>& Results);

UFUNCTION()
void HandleFindFailure(const TArray<FBlueprintSessionResult>& Results);

void FindSteamGames()
{
    if (FindProxy)
    {
        return;
    }

    FSessionsSearchSetting Filter;
    Filter.PropertyKeyPair = UAdvancedSessionsLibrary::MakeLiteralSessionPropertyInt(TEXT("GameMode"), 1);
    Filter.ComparisonOp = EOnlineComparisonOpRedux::Equals;
    TArray<FSessionsSearchSetting> Filters;
    Filters.Add(Filter);

    FindProxy = UFindSessionsCallbackProxyAdvanced::FindSessionsAdvanced(
        GetWorld(),
        this,                                   // PlayerController
        20,                                     // MaxResults
        false,                                  // bUseLAN：Steam 填 false，局域网填 true
        EBPServerPresenceSearchType::AllServers,
        Filters,
        false,                                  // bEmptyServersOnly
        false,                                  // bNonEmptyServersOnly
        false,                                  // bSecureServersOnly
        1);                                     // MinSlotsAvailable

    if (!FindProxy)
    {
        return;
    }

    FindProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleFindSuccess);
    FindProxy->OnFailure.AddDynamic(this, &ThisClass::HandleFindFailure);
    FindProxy->Activate();
}
```

### 5.4 加入会话

插件不提供专用的 C++ Join 代理，加入会话使用引擎在线会话接口：

```cpp
#include "OnlineSubsystem.h"
#include "OnlineSubsystemUtils.h"
#include "Interfaces/OnlineSessionInterface.h"
#include "Kismet/GameplayStatics.h"

void HandleFindSuccess(const TArray<FBlueprintSessionResult>& Results)
{
    FindProxy = nullptr;

    if (Results.Num() == 0)
    {
        return;
    }

    IOnlineSubsystem* OSS = Online::GetSubsystem(GetWorld());
    IOnlineSessionPtr Sessions = OSS ? OSS->GetSessionInterface() : nullptr;
    if (!Sessions.IsValid())
    {
        return;
    }

    JoinCompleteDelegateHandle = Sessions->AddOnJoinSessionCompleteDelegate_Handle(JoinCompleteDelegate);
    if (!Sessions->JoinSession(0, NAME_GameSession, Results[0].OnlineResult))
    {
        Sessions->ClearOnJoinSessionCompleteDelegate_Handle(JoinCompleteDelegateHandle);
    }
}

void HandleJoinComplete(FName SessionName, EOnJoinSessionCompleteResult::Type Result)
{
    IOnlineSubsystem* OSS = Online::GetSubsystem(GetWorld());
    IOnlineSessionPtr Sessions = OSS ? OSS->GetSessionInterface() : nullptr;
    if (Sessions.IsValid())
    {
        Sessions->ClearOnJoinSessionCompleteDelegate_Handle(JoinCompleteDelegateHandle);
    }

    if (Result != EOnJoinSessionCompleteResult::Success)
    {
        return;
    }

    FString ConnectString;
    if (Sessions.IsValid() && Sessions->GetResolvedConnectString(NAME_GameSession, ConnectString))
    {
        if (APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0))
        {
            PC->ClientTravel(ConnectString, TRAVEL_Absolute);
        }
    }
}
```

其中 `JoinCompleteDelegate` 在构造函数中初始化：

```cpp
JoinCompleteDelegate = FOnJoinSessionCompleteDelegate::CreateUObject(
    this, &ThisClass::HandleJoinComplete);
```

### 5.5 更新、开始、结束与取消

```cpp
#include "UpdateSessionCallbackProxyAdvanced.h"
#include "StartSessionCallbackProxyAdvanced.h"
#include "EndSessionCallbackProxy.h"
#include "CancelFindSessionsCallbackProxy.h"

// UpdateSession 示例
UPROPERTY()
TObjectPtr<UUpdateSessionCallbackProxyAdvanced> UpdateProxy;

void UpdateRoom()
{
    TArray<FSessionPropertyKeyPair> ExtraSettings;
    UpdateProxy = UUpdateSessionCallbackProxyAdvanced::UpdateSession(
        GetWorld(), ExtraSettings,
        8, 0, true, true, true, true, false, true, true, false);
    // 参数顺序：PublicConnections, PrivateConnections, bUseLAN, bAllowInvites,
    // bAllowJoinInProgress, bRefreshOnlineData, bIsDedicatedServer,
    // bShouldAdvertise, bAllowJoinViaPresence, bAllowJoinViaPresenceFriendsOnly
    UpdateProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleUpdateSuccess);
    UpdateProxy->OnFailure.AddDynamic(this, &ThisClass::HandleUpdateFailure);
    UpdateProxy->Activate();
}

// StartSession：创建时 bStartAfterCreate=false 时使用
UStartSessionCallbackProxyAdvanced* StartProxy =
    UStartSessionCallbackProxyAdvanced::StartAdvancedSession(GetWorld());
StartProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleStartSuccess);
StartProxy->OnFailure.AddDynamic(this, &ThisClass::HandleStartFailure);
StartProxy->Activate();

// EndSession：多数场景应改用引擎 Destroy Session
UEndSessionCallbackProxy* EndProxy =
    UEndSessionCallbackProxy::EndSession(GetWorld(), this);
EndProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleEndSuccess);
EndProxy->OnFailure.AddDynamic(this, &ThisClass::HandleEndFailure);
EndProxy->Activate();

// CancelFindSessions
UCancelFindSessionsCallbackProxy* CancelProxy =
    UCancelFindSessionsCallbackProxy::CancelFindSessions(GetWorld(), this);
CancelProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleCancelSuccess);
CancelProxy->OnFailure.AddDynamic(this, &ThisClass::HandleCancelFailure);
CancelProxy->Activate();
```

### 5.6 同步工具函数

```cpp
#include "AdvancedSessionsLibrary.h"

// 踢出玩家（仅服务器）
bool bKicked = UAdvancedSessionsLibrary::KickPlayer(
    GetWorld(), TargetPC, FText::FromString(TEXT("违反房间规则")));

// 服务器跳转
bool bTravelled = UAdvancedSessionsLibrary::ServerTravel(
    GetWorld(), TEXT("GameMap?listen"), false, false);

// 会话状态
EBPOnlineSessionState State = EBPOnlineSessionState::NoSession;
UAdvancedSessionsLibrary::GetSessionState(GetWorld(), State);

// 玩家 ID
FBPUniqueNetId LocalId;
UAdvancedSessionsLibrary::GetUniqueNetID(this, LocalId);

// 自定义属性
FSessionPropertyKeyPair Property =
    UAdvancedSessionsLibrary::MakeLiteralSessionPropertyString(TEXT("ServerName"), TEXT("DemoRoom"));
```

### 5.7 好友、身份与语音

```cpp
#include "AdvancedFriendsLibrary.h"
#include "AdvancedIdentityLibrary.h"
#include "AdvancedVoiceLibrary.h"

// 读取缓存好友列表
TArray<FBPFriendInfo> Friends;
UAdvancedFriendsLibrary::GetStoredFriendsList(this, Friends);

// 邀请单个好友
UAdvancedFriendsLibrary::SendSessionInviteToFriend(this, FriendId, Result);

// 登录状态
EBPLoginStatus Status = EBPLoginStatus::NotLoggedIn;
EBlueprintResultSwitch LoginResult = EBlueprintResultSwitch::OnFailure;
UAdvancedIdentityLibrary::GetLoginStatus(GetWorld(), LocalId, Status, LoginResult);

// 语音
UAdvancedVoiceLibrary::StartNetworkedVoice(GetWorld(), 0);
bool bTalking = UAdvancedVoiceLibrary::IsLocalPlayerTalking(GetWorld(), 0);
```

### 5.8 Steam 扩展

```cpp
#include "AdvancedSteamFriendsLibrary.h"
#include "AdvancedSteamWorkshopLibrary.h"

// 获取本地 Steam ID
FBPUniqueNetId SteamId = UAdvancedSteamFriendsLibrary::GetLocalSteamIDFromSteam();

// 预加载好友信息
UAdvancedSteamFriendsLibrary::RequestSteamFriendInfo(SteamId, false);

// 获取头像（异步，Result 为 EBlueprintAsyncResultSwitch）
EBlueprintAsyncResultSwitch AvatarResult = EBlueprintAsyncResultSwitch::AsyncLoading;
UTexture2D* Avatar = UAdvancedSteamFriendsLibrary::GetSteamFriendAvatar(
    SteamId, AvatarResult, SteamAvatarSize::SteamAvatar_Medium);

// 初始化文本过滤并过滤
UAdvancedSteamFriendsLibrary::InitTextFiltering();
FString Filtered;
bool bFiltered = UAdvancedSteamFriendsLibrary::FilterText(
    TEXT("raw text"), EBPTextFilteringContext::FContext_Chat, SteamId, Filtered);

// 创意工坊
int32 NumItems = 0;
TArray<FBPSteamWorkshopID> Items =
    UAdvancedSteamWorkshopLibrary::GetSubscribedWorkshopItems(NumItems);
```

### 5.9 好友/身份事件

将项目的 `GameInstanceClass` 设为 `UAdvancedFriendsGameInstance` 或其 C++ 子类，可接收以下 `BlueprintImplementableEvent`：

| 事件 | 参数 |
|---|---|
| `OnSessionInviteReceived` | `LocalPlayerNum`、`PersonInviting`、`AppId`、`SessionToJoin` |
| `OnSessionInviteAccepted` | `LocalPlayerNum`、`PersonInvited`、`SessionToJoin` |
| `OnPlayerTalkingStateChanged` | `PlayerId`、`bIsTalking` |
| `OnPlayerLoginChanged` | `PlayerNum` |
| `OnPlayerLoginStatusChanged` | `PlayerNum`、`PreviousStatus`、`NewStatus`、`NewPlayerUniqueNetID` |

也可让 `APlayerController` 实现 `IAdvancedFriendsInterface`，并把 GameInstance 属性 `bCallFriendInterfaceEventsOnPlayerControllers`、`bCallIdentityInterfaceEventsOnPlayerControllers`、`bCallVoiceInterfaceEventsOnPlayerControllers` 设为 `true`，将事件分发到 PlayerController。

C++ 中在子类里重写这些 `BlueprintImplementableEvent` 时，使用原生 `void OnSessionInviteReceived_Implementation(...)` 形式。

---

---

## 6. 常见注意事项

1. `bUseLAN` 在主机和客户端必须一致；主机地图必须使用 `?listen` 选项加载。
2. `PublicConnections` 在 Listen Server 中要把主机自身算作一个连接，计划允许 N 名客户端时至少填 `N+1`。
3. `bShouldAdvertise=false` 时房间不会被搜索到，只能通过邀请加入。
4. 专用服务器创建时应设置 `bIsDedicatedServer=true`，且不依赖 Presence。
5. Steam 功能仅在使用 Steam 在线子系统时可用；正式发布必须替换 `SteamDevAppId`。
6. `End Session` 是旧接口，大多数销毁场景应使用引擎自带 `Destroy Session`。
7. 5.x 节点在 C++ 签名中普遍带有 `WorldContextObject` 参数，但蓝图节点通常不显示 `World Context Object` 引脚；只有纯 C++ 调用时需要传入 `GetWorld()` 或 `GetGameInstance()`。
8. C++ 异步代理对象必须持有到回调结束；回调成功后清空 `UPROPERTY` 引用即可。

---

## 附：核心节点中英文对照

| 中文显示名（汉化分支） | 英文函数名 |
|---|---|
| 创建高级会话 | `CreateAdvancedSession` |
| 高级查找会话 | `FindSessionsAdvanced` |
| 开始高级会话 | `StartAdvancedSession` |
| 更新会话 | `UpdateSession` |
| 结束会话 | `EndSession` |
| 取消查找会话 | `CancelFindSessions` |
| 查找好友会话 | `FindFriendSession` |
| 获取并存储好友列表 | `GetAndStoreFriendsList` |
| 发送会话邀请给好友 | `SendSessionInviteToFriend` |
| 自动登录用户 | `AutoLoginUser` |
| 登录用户 | `LoginUser` |
| 登出用户 | `LogoutUser` |
| 获取登录状态 | `GetLoginStatus` |
| 获取玩家昵称 | `GetPlayerNickname` |
| 是否佩戴耳机 | `IsHeadsetPresent` |
| 开始网络语音 | `StartNetworkedVoice` |
| 停止网络语音 | `StopNetworkedVoice` |
| 静音远程讲话者 | `MuteRemoteTalker` |
| 取消静音远程讲话者 | `UnMuteRemoteTalker` |
| 显示好友列表界面 | `ShowFriendsUI` |
| 显示邀请界面 | `ShowInviteUI` |
| 显示玩家资料界面 | `ShowProfileUI` |
| 显示网页URL界面 | `ShowWebURLUI` |
| 关闭网页URL界面 | `CloseWebURLUI` |
| 获取Steam好友头像 | `GetSteamFriendAvatar` |
| 请求Steam好友信息 | `RequestSteamFriendInfo` |
| 获取Steam群组列表 | `GetSteamGroups` |
| 初始化文本过滤 | `InitTextFiltering` |
| 过滤文本 | `FilterText` |
| 获取已订阅创意工坊物品 | `GetSubscribedWorkshopItems` |
| 获取创意工坊物品详情 | `GetWorkshopItemDetails` |

---

> 本文档仅生成一个 Markdown 文件。C++ 函数名、参数类型、返回值类型和枚举保持英文；中文显示名仅用于汉化分支中的蓝图搜索与阅读。


## 7. 完整实际使用案例

以下两个案例完成同一功能：在局域网中创建房间、搜索房间并加入。蓝图案例不写 C++，纯 C++ 案例不依赖蓝图逻辑。两者都以一个名为 `GameMap` 的游戏地图和一个名为 `MenuMap` 的菜单地图为前提。

### 6.1 蓝图完整案例：局域网主机 / 客户端加入

#### 6.1.1 项目准备

1. 新建蓝图项目，启用 `AdvancedSessions` 插件。
2. 创建两张地图：
   - `MenuMap`：作为主菜单，放置 UI。
   - `GameMap`：作为实际游戏地图。
3. 在 **Project Settings > Maps & Modes** 中：
   - `Default Map` 设为 `MenuMap`。
   - `Editor Startup Map` 设为 `MenuMap`。
   - `Game Default Map` 设为 `GameMap`（非必需，但建议设置）。
4. 创建 Widget Blueprint，命名为 `WBP_MainMenu`，在 Designer 中放入两个按钮：
   - `Button_Host`，文本为“创建房间”。
   - `Button_Join`，文本为“加入房间”。

#### 6.1.2 主机：创建房间并进入地图

在 `Button_Host` 的 `OnClicked` 事件后连接以下节点：

| 顺序 | 节点 | 连接与设置 |
|---|---|---|
| 1 | `Get Player Controller` | `Player Index = 0` |
| 2 | `Create Advanced Session` | `Player Controller` 接步骤 1；`Public Connections = 4`；`Private Connections = 0`；`Use LAN = true`；`Allow Invites = true`；`Is Dedicated Server = false`；`Use Lobbies If Available = false`；`Allow Join Via Presence = true`；`Allow Join Via Presence Friends Only = false`；`Should Advertise = true`；`Start After Create = true`；其余保持默认 |
| 3 | `Server Travel` | 连接 `Create Advanced Session` 的 `On Success`；`In URL = GameMap?listen`；`bAbsolute = false`；`bShouldSkipGameNotify = false` |
| 4 | `Print String` | 连接 `Create Advanced Session` 的 `On Failure`，输出“创建失败” |

说明：主机创建会话成功后，`ServerTravel` 以 `?listen` 方式进入 `GameMap`，此时该进程成为 Listen Server，客户端即可搜索到该房间。

#### 6.1.3 客户端：搜索并加入房间

在 `Button_Join` 的 `OnClicked` 事件后连接以下节点：

| 顺序 | 节点 | 连接与设置 |
|---|---|---|
| 1 | `Get Player Controller` | `Player Index = 0` |
| 2 | `Find Sessions Advanced` | `Player Controller` 接步骤 1；`Max Results = 20`；`Use LAN = true`；`Server Type To Search = All Servers`；`Filters` 留空；`Min Slots Available = 1`；其余保持默认 |
| 3 | `Get`（数组取元素） | 连接 `Find Sessions Advanced` 的 `On Success`，把返回的 `Results` 数组连接到 `Get` 的数组引脚，`Index = 0` |
| 4 | `Join Session`（引擎自带） | `Player Controller` 接步骤 1；`Search Result` 接步骤 3 的输出 |
| 5 | `Print String` | 连接 `Join Session` 的 `On Success` 输出“加入成功”；连接 `On Failure` 输出“加入失败” |

说明：`Join Session` 成功后会执行平台跳转。若搜索结果为空，`Get` 节点会返回无效对象，`Join Session` 会走失败分支；生产项目中应先判断 `Results` 数组长度。

#### 6.1.4 将 Widget 显示到屏幕

在 `MenuMap` 的 Level Blueprint 中：

```text
Event BeginPlay
-> Create Widget（Class = WBP_MainMenu）
-> Add to Viewport
```

#### 6.1.5 验证清单

- 局域网内两台设备运行项目，或编辑器使用两个独立 PIE 实例。
- 第一台点击“创建房间”，应进入 `GameMap`。
- 第二台点击“加入房间”，应搜索到房间并进入同一 `GameMap`。
- 两台设备都进入同一地图即表示 LAN 会话流程成功。

### 6.2 纯 C++ 完整案例：可执行的主机 / 搜索 / 加入逻辑

以下代码不依赖任何蓝图节点，仅通过 C++ 类和项目配置完成。假设项目 C++ 模块名为 `MyGame`。

#### 6.2.1 修改 Build.cs

在 `MyGame.Build.cs` 中加入：

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
    "Core",
    "CoreUObject",
    "Engine",
    "InputCore",
    "OnlineSubsystem",
    "OnlineSubsystemUtils",
    "AdvancedSessions"
});
```

#### 6.2.2 创建 GameMode

`MyGameModeBase.h`：

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "MyGameModeBase.generated.h"

UCLASS()
class MYGAME_API AMyGameModeBase : public AGameModeBase
{
    GENERATED_BODY()

public:
    AMyGameModeBase();
};
```

`MyGameModeBase.cpp`：

```cpp
#include "MyGameModeBase.h"
#include "MyPlayerController.h"

AMyGameModeBase::AMyGameModeBase()
{
    // 使默认玩家控制器使用下方 C++ 控制器
    PlayerControllerClass = AMyPlayerController::StaticClass();
}
```

#### 6.2.3 创建 PlayerController

`MyPlayerController.h`：

```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "CreateSessionCallbackProxyAdvanced.h"
#include "FindSessionsCallbackProxyAdvanced.h"
#include "MyPlayerController.generated.h"

UCLASS()
class MYGAME_API AMyPlayerController : public APlayerController
{
    GENERATED_BODY()

public:
    AMyPlayerController();

    // 控制台输入 HostLan：创建局域网会话并跳转 GameMap
    UFUNCTION(Exec)
    void HostLan();

    // 控制台输入 FindLan：搜索局域网会话并加入第一个结果
    UFUNCTION(Exec)
    void FindLan();

private:
    UFUNCTION()
    void HandleHostSuccess();

    UFUNCTION()
    void HandleHostFailure();

    UFUNCTION()
    void HandleFindSuccess(const TArray<FBlueprintSessionResult>& Results);

    UFUNCTION()
    void HandleFindFailure(const TArray<FBlueprintSessionResult>& Results);

    void JoinSessionResult(const FBlueprintSessionResult& Result);
    void HandleJoinComplete(FName SessionName, EOnJoinSessionCompleteResult::Type Result);

    UPROPERTY()
    TObjectPtr<UCreateSessionCallbackProxyAdvanced> CreateProxy;

    UPROPERTY()
    TObjectPtr<UFindSessionsCallbackProxyAdvanced> FindProxy;

    FOnJoinSessionCompleteDelegate JoinCompleteDelegate;
    FDelegateHandle JoinCompleteDelegateHandle;
};
```

`MyPlayerController.cpp`：

```cpp
#include "MyPlayerController.h"
#include "AdvancedSessionsLibrary.h"
#include "OnlineSubsystem.h"
#include "OnlineSubsystemUtils.h"
#include "Interfaces/OnlineSessionInterface.h"
#include "Kismet/GameplayStatics.h"

AMyPlayerController::AMyPlayerController()
{
    JoinCompleteDelegate = FOnJoinSessionCompleteDelegate::CreateUObject(
        this, &AMyPlayerController::HandleJoinComplete);
}

void AMyPlayerController::HostLan()
{
    if (CreateProxy)
    {
        return;
    }

    TArray<FSessionPropertyKeyPair> ExtraSettings;
    ExtraSettings.Add(UAdvancedSessionsLibrary::MakeLiteralSessionPropertyInt(TEXT("GameMode"), 1));

    CreateProxy = UCreateSessionCallbackProxyAdvanced::CreateAdvancedSession(
        GetWorld(),
        ExtraSettings,
        this,       // 非专用服务器必须提供本地 PlayerController
        4,          // PublicConnections
        0,          // PrivateConnections
        true,       // bUseLAN
        true,       // bAllowInvites
        false,      // bIsDedicatedServer
        false,      // bUseLobbiesIfAvailable
        true,       // bAllowJoinViaPresence
        false,      // bAllowJoinViaPresenceFriendsOnly
        false,      // bAntiCheatProtected
        false,      // bUsesStats
        true,       // bShouldAdvertise
        false,      // bUseLobbiesVoiceChatIfAvailable
        true);      // bStartAfterCreate

    if (!CreateProxy)
    {
        return;
    }

    CreateProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleHostSuccess);
    CreateProxy->OnFailure.AddDynamic(this, &ThisClass::HandleHostFailure);
    CreateProxy->Activate();
}

void AMyPlayerController::HandleHostSuccess()
{
    CreateProxy = nullptr;
    GetWorld()->ServerTravel(TEXT("GameMap?listen"), false, false);
}

void AMyPlayerController::HandleHostFailure()
{
    CreateProxy = nullptr;
    UE_LOG(LogTemp, Warning, TEXT("HostLan failed"));
}

void AMyPlayerController::FindLan()
{
    if (FindProxy)
    {
        return;
    }

    FSessionsSearchSetting Filter;
    Filter.PropertyKeyPair = UAdvancedSessionsLibrary::MakeLiteralSessionPropertyInt(TEXT("GameMode"), 1);
    Filter.ComparisonOp = EOnlineComparisonOpRedux::Equals;

    TArray<FSessionsSearchSetting> Filters;
    Filters.Add(Filter);

    FindProxy = UFindSessionsCallbackProxyAdvanced::FindSessionsAdvanced(
        GetWorld(),
        this,
        20,       // MaxResults
        true,     // bUseLAN
        EBPServerPresenceSearchType::AllServers,
        Filters,
        false,    // bEmptyServersOnly
        false,    // bNonEmptyServersOnly
        false,    // bSecureServersOnly
        1);       // MinSlotsAvailable

    if (!FindProxy)
    {
        return;
    }

    FindProxy->OnSuccess.AddDynamic(this, &ThisClass::HandleFindSuccess);
    FindProxy->OnFailure.AddDynamic(this, &ThisClass::HandleFindFailure);
    FindProxy->Activate();
}

void AMyPlayerController::HandleFindSuccess(const TArray<FBlueprintSessionResult>& Results)
{
    FindProxy = nullptr;

    if (Results.Num() == 0)
    {
        UE_LOG(LogTemp, Warning, TEXT("No sessions found"));
        return;
    }

    JoinSessionResult(Results[0]);
}

void AMyPlayerController::HandleFindFailure(const TArray<FBlueprintSessionResult>& Results)
{
    FindProxy = nullptr;
    UE_LOG(LogTemp, Warning, TEXT("FindLan failed"));
}

void AMyPlayerController::JoinSessionResult(const FBlueprintSessionResult& Result)
{
    IOnlineSubsystem* OSS = Online::GetSubsystem(GetWorld());
    IOnlineSessionPtr Sessions = OSS ? OSS->GetSessionInterface() : nullptr;
    if (!Sessions.IsValid())
    {
        UE_LOG(LogTemp, Warning, TEXT("Online session interface unavailable"));
        return;
    }

    JoinCompleteDelegateHandle = Sessions->AddOnJoinSessionCompleteDelegate_Handle(JoinCompleteDelegate);
    if (!Sessions->JoinSession(0, NAME_GameSession, Result.OnlineResult))
    {
        Sessions->ClearOnJoinSessionCompleteDelegate_Handle(JoinCompleteDelegateHandle);
        UE_LOG(LogTemp, Warning, TEXT("JoinSession call failed"));
    }
}

void AMyPlayerController::HandleJoinComplete(FName SessionName, EOnJoinSessionCompleteResult::Type Result)
{
    IOnlineSubsystem* OSS = Online::GetSubsystem(GetWorld());
    IOnlineSessionPtr Sessions = OSS ? OSS->GetSessionInterface() : nullptr;
    if (Sessions.IsValid())
    {
        Sessions->ClearOnJoinSessionCompleteDelegate_Handle(JoinCompleteDelegateHandle);
    }

    if (Result != EOnJoinSessionCompleteResult::Success)
    {
        UE_LOG(LogTemp, Warning, TEXT("Join session failed"));
        return;
    }

    FString ConnectString;
    if (Sessions.IsValid() && Sessions->GetResolvedConnectString(NAME_GameSession, ConnectString))
    {
        if (APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0))
        {
            PC->ClientTravel(ConnectString, TRAVEL_Absolute);
        }
    }
}
```

注意：`JoinCompleteDelegate` 需要在构造函数中初始化。可在 `AMyPlayerController` 构造函数中加入：

```cpp
JoinCompleteDelegate = FOnJoinSessionCompleteDelegate::CreateUObject(
    this, &AMyPlayerController::HandleJoinComplete);
```

#### 6.2.4 项目配置

在 `Config/DefaultEngine.ini` 中设置默认 GameMode：

```ini
[/Script/EngineSettings.GameMapsSettings]
GlobalDefaultGameMode=/Script/MyGame.MyGameModeBase
GameDefaultMap=/Game/Maps/GameMap
EditorStartupMap=/Game/Maps/MenuMap
```

具体地图路径按项目实际命名调整。若在 Project Settings 中手动选择 GameMode，则无需手写上述 GameMode 配置。

#### 6.2.5 测试方式

1. 编译项目。
2. 运行第一个实例，在控制台（`~` 键）输入 `HostLan`，进入 `GameMap`，进程成为 Listen Server。
3. 运行第二个实例，在控制台输入 `FindLan`，自动搜索并加入第一个实例。
4. 观察两个实例是否进入同一地图；`GameMode=1` 过滤条件会同时验证自定义属性与搜索过滤。

---



