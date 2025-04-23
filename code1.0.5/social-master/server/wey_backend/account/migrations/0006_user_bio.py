from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0005_user_people_you_may_know'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, null=True, verbose_name='个人介绍'),
        ),
    ] 