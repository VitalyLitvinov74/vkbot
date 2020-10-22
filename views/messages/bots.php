<?php

use yii\grid\GridView;
use yii\widgets\Pjax;

Pjax::begin();
echo GridView::widget([
    'dataProvider' => $dataProvider,
    'columns' => [
        'id',
        'botName',
    ],
]);
Pjax::end();