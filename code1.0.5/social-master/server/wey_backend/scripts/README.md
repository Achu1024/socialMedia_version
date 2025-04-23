# 定时任务调度器

这个目录包含社交网站的定时脚本和调度器。

## 定时脚本

1. **generate_trends.py** - 从帖子中提取热门标签并创建趋势
2. **generate_friend_suggestions.py** - 为用户生成可能认识的人（好友推荐）
3. **schedule_tasks.py** - 用于调度上述脚本定期执行的调度器

## 使用方法

### 直接运行单个脚本

```bash
python generate_trends.py
python generate_friend_suggestions.py
```

### 使用调度器运行（推荐）

启动调度器后，它会按照预定计划自动执行脚本：

```bash
python schedule_tasks.py
```

默认调度计划：
- 生成趋势标签：每小时执行一次
- 生成好友推荐：每天凌晨3点执行

## 自定义调度计划

如需修改执行频率，请编辑 `schedule_tasks.py` 文件中的 `setup_schedule()` 函数。

## 作为服务运行

### Windows

1. 创建批处理文件 `run_scheduler.bat`：
```bat
@echo off
cd /d 路径到wey_backend目录
python scripts/schedule_tasks.py
```

2. 使用任务计划程序设置为开机启动或定时启动

### Linux

1. 创建系统服务文件
2. 或使用 screen/tmux 在后台运行：
```bash
screen -S wey_scheduler
python scripts/schedule_tasks.py
# 按 Ctrl+A 然后按 D 分离
```

## 日志

调度器运行时会输出日志，显示任务执行情况。 