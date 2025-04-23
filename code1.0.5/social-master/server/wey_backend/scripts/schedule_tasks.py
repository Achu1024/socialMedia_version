#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import time
import schedule
import subprocess
import logging

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('wey_scheduler')

# 获取当前脚本目录
current_dir = os.path.dirname(os.path.abspath(__file__))

def run_generate_trends():
    """执行生成趋势标签的脚本"""
    try:
        logger.info("开始执行生成趋势标签任务...")
        script_path = os.path.join(current_dir, 'generate_trends.py')
        subprocess.run([sys.executable, script_path], check=True)
        logger.info("生成趋势标签任务完成")
    except Exception as e:
        logger.error(f"生成趋势标签任务失败: {e}")

def run_generate_friend_suggestions():
    """执行生成好友推荐的脚本"""
    try:
        logger.info("开始执行生成好友推荐任务...")
        script_path = os.path.join(current_dir, 'generate_friend_suggestions.py')
        subprocess.run([sys.executable, script_path], check=True)
        logger.info("生成好友推荐任务完成")
    except Exception as e:
        logger.error(f"生成好友推荐任务失败: {e}")

def setup_schedule():
    """设置定时任务计划"""
    # 每小时执行一次生成趋势标签
    schedule.every(1).hours.do(run_generate_trends)
    
    # 每天凌晨3点执行一次好友推荐
    schedule.every().day.at("03:00").do(run_generate_friend_suggestions)
    
    logger.info("定时任务已设置")
    logger.info("- 生成趋势标签: 每小时执行一次")
    logger.info("- 生成好友推荐: 每天03:00执行")

if __name__ == "__main__":
    setup_schedule()
    
    # 初次启动时立即执行一次
    run_generate_trends()
    run_generate_friend_suggestions()
    
    logger.info("定时任务调度器已启动")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 每分钟检查一次是否有任务需要执行
    except KeyboardInterrupt:
        logger.info("定时任务调度器已停止") 