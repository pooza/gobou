<?php

// gobou の PHP-CS-Fixer の設定。利用側の .php-cs-fixer.dist.php から、Finder を渡して呼ぶ。
//
//   return (require __DIR__ . '/vendor/pooza/gobou/php/php-cs-fixer.php')(
//       PhpCsFixer\Finder::create()->in(__DIR__)->exclude(['vendor', 'node_modules']),
//   );
//
// ⚠ 土台は PER-CS（現代的な PHP の書き方。スペース 4）。PHP 8.3 以降だけを前提にする
// （pooza/ginseng-style#142）。⚠ risky な規則は入れない（挙動が変わりうる直しを、整形に混ぜない）。

return static function (PhpCsFixer\Finder $finder): PhpCsFixer\Config {
    return (new PhpCsFixer\Config())
        ->setRiskyAllowed(false)
        ->setRules([
            '@PER-CS' => true,
            '@PHP83Migration' => true,
        ])
        ->setFinder($finder);
};
