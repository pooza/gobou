<?php

// PHP 8.4 で非推奨の書き方（? を付けずに null を既定値にする）。水準 0 から出る
function legacy(Exception $prev = null): void
{
}
