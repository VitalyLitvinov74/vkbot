<?php

use yii\grid\GridView;
use yii\helpers\Html;
use yii\helpers\Url;
use yii\widgets\Pjax;

Pjax::begin();
echo GridView::widget([
    'dataProvider' => $dataProvider,
    'columns' => [
        'id',
        [
            'attribute'=>'botName',
            'label'=>'Bot name',
            'format' => 'raw',
            'value'=>function($data){
                $link = '<a href="'. Url::toRoute([$data['botName'] . '/messages']) .'">'. $data['botName'] .'</a>';
                return $link;
            }
        ]
    ],
]);
Pjax::end();