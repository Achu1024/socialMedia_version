# Generated by Django 4.2 on 2025-04-26 09:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0009_friendshiprequest_message'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='show_likes_to_others',
            field=models.BooleanField(default=True, verbose_name='向其他用户显示点赞内容'),
        ),
    ]
