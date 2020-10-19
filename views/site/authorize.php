<?php

/* @var $this \yii\web\View */
/* @var $content string */

use app\widgets\Alert;
use yii\helpers\Html;
use yii\bootstrap\Nav;
use yii\bootstrap\NavBar;
use yii\widgets\Breadcrumbs;
use app\assets\AppAsset;

AppAsset::register($this);
?>
<?php $this->beginPage() ?>
<!DOCTYPE html>
<html lang="<?= Yii::$app->language ?>">
<head>
    <meta charset="<?= Yii::$app->charset ?>">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php $this->registerCsrfMetaTags() ?>
    <title><?= Html::encode($this->title) ?></title>
    <?php $this->head() ?>
</head>
<body>
<?php $this->beginBody() ?>

<div class="logon">
    <div class="row">
        <div class="name">Логин: </div>
        <input type="text" autocomplete="username-admin" required />
    </div>
    <div class="row">
        <div class="name">Пароль: </div>
        <input type="password" name="password-admin" autocomplete="current-password-admin" required />
    </div>
    <div class="row">
        <p class="message"><span>Неверный логин/пароль.</span></p> <!-- место для ошибки -->
        <input type="button" value="Вход" class="button-send" />
    </div>
</div>


<?php $this->endBody() ?>
</body>
</html>
<?php $this->endPage() ?>
