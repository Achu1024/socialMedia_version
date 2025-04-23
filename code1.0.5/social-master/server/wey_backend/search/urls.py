from django.urls import path

from . import api


urlpatterns = [
    path('', api.search, name='search'),
    path('posts/', api.search_posts_paginated, name='search_posts_paginated'),
]