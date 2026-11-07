<?php

// 水準 5 で引数の型の誤り（argument.type）が出ること。⚠ 水準 4 以下では出ない
function takesInt(int $value): int
{
    return $value;
}

takesInt('not an int');
