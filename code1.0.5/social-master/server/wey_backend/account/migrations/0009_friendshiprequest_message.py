# Generated by Django 4.2 on 2025-04-24 08:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0008_user_is_admin'),
    ]

    operations = [
        migrations.AddField(
            model_name='friendshiprequest',
            name='message',
            field=models.CharField(blank=True, help_text='好友请求附带的消息', max_length=15, null=True),
        ),
    ]
