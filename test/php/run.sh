#!/usr/bin/env bash
# PHP の共有設定を検体にかけ、期待どおりに引っかかるかを見る。
# 🔴 道具の版を上げたときに、規則の名前が変わる・水準の中身が変わるなどで黙って外れると、
# 検査が減ったことに誰も気づかない。ここで赤にする。
set -uo pipefail
cd "$(dirname "$0")/../.."
bin=vendor/bin
fail=0
ng() { echo "NG: $*"; fail=1; }

# 整形: 悪い形は直される、良い形は触られない
cat > /tmp/gobou-cs.php <<'PHP'
<?php
return (require getcwd() . '/php/php-cs-fixer.php')(PhpCsFixer\Finder::create()->in(getcwd() . '/test/php')->name('format_*.php'));
PHP
changed=$($bin/php-cs-fixer fix --config=/tmp/gobou-cs.php --dry-run --format=json --using-cache=no 2>/dev/null | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach($d["files"] as $f) echo basename($f["name"]),"\n";')
grep -qx format_bad.php <<<"$changed" || ng 'php-cs-fixer: format_bad.php が直されない'
grep -qx format_good.php <<<"$changed" && ng 'php-cs-fixer: format_good.php が書き換わる'

# 静的解析: 共通の設定（水準 5）で、出るべきものが出る
cat > /tmp/gobou-phpstan.neon <<NEON
includes:
  - $(pwd)/php/phpstan.neon
NEON
ids=$($bin/phpstan analyse -c /tmp/gobou-phpstan.neon --no-progress --error-format=json test/php/analyse_level5.php test/php/analyse_nullable.php 2>/dev/null | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach($d["files"] as $p=>$v) foreach($v["messages"] as $m) echo basename($p),":",$m["identifier"] ?? "?","\n";')
grep -qx 'analyse_level5.php:argument.type' <<<"$ids" || ng "phpstan: analyse_level5.php に argument.type が出ない（出たもの: $ids）"
grep -qx 'analyse_nullable.php:parameter.implicitlyNullable' <<<"$ids" || ng "phpstan: analyse_nullable.php に parameter.implicitlyNullable が出ない"

# WordPress の Security
src=$($bin/phpcs --standard=php/phpcs-wordpress-security.xml --report=json test/php/wordpress_security.php 2>/dev/null | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach($d["files"] as $v) foreach($v["messages"] as $m) echo $m["source"],"\n";')
grep -q '^WordPress.Security.EscapeOutput' <<<"$src" || ng "phpcs: EscapeOutput が出ない（出たもの: $src）"
grep -q '^WordPress.Security.ValidatedSanitizedInput' <<<"$src" || ng 'phpcs: ValidatedSanitizedInput が出ない'

[ $fail = 0 ] && echo 'PHP の検体が期待どおり'
exit $fail
