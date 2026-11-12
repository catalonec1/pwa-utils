<?php
/**
 * Minimal tests for Unit Flip without a WordPress install (stubs the few WP functions used).
 * Run: php wordpress/tests/run.php
 */
define( 'ABSPATH', __DIR__ );
$GLOBALS['uf_filters'] = array();
function add_filter( $h, $cb, $p = 10, $a = 1 ) { $GLOBALS['uf_filters'][ $h ][] = $cb; }
function apply_filters( $h, $v ) { foreach ( $GLOBALS['uf_filters'][ $h ] ?? array() as $cb ) { $v = $cb( $v ); } return $v; }
function add_action() {}
function add_shortcode() {}
function number_format_i18n( $n, $d = 0 ) { return number_format( $n, $d, '.', ',' ); }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_attr( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function __( $s ) { return $s; }
function get_option( $k, $d = false ) { return $d; }
function wp_parse_args( $a, $d ) { return array_merge( $d, $a ); }
function shortcode_atts( $pairs, $atts ) { $atts = (array) $atts; $o = array(); foreach ( $pairs as $k => $v ) { $o[ $k ] = array_key_exists( $k, $atts ) ? $atts[ $k ] : $v; } return $o; }
function wp_enqueue_style() {}
function wp_enqueue_script() {}
function esc_attr__( $s ) { return $s; }
function esc_html__( $s ) { return $s; }
function is_feed() { return false; }
function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $k ) ); }
define( 'UNIT_FLIP_URL', '' );
define( 'UNIT_FLIP_PRO_URL_BASE', '' );
define( 'UNIT_FLIP_PRO_VERSION', 'test' );
define( 'UNIT_FLIP_DIR', dirname( __DIR__ ) . '/unit-flip/' );
require UNIT_FLIP_DIR . 'includes/class-unit-flip-units.php';
require UNIT_FLIP_DIR . 'includes/class-unit-flip.php';
if ( getenv( 'UF_PRO' ) ) {
	require dirname( __DIR__ ) . '/unit-flip-pro/includes/class-unit-flip-pro.php';
}

$fails = 0; $n = 0;
function eq( $name, $got, $want ) {
	global $fails, $n; ++$n;
	if ( $got !== $want ) { ++$fails; echo "FAIL $name\n  got:  " . var_export( $got, true ) . "\n  want: " . var_export( $want, true ) . "\n"; }
}
function near( $name, $got, $want, $eps = 1e-6 ) { eq( $name, null !== $got && abs( $got - $want ) <= $eps * max( 1, abs( $want ) ), true ); }

near( 'F->C', Unit_Flip_Units::convert( 350, 'F', 'C' ), 176.6666667 );
near( 'C->K', Unit_Flip_Units::convert( 0, 'C', 'K' ), 273.15 );
near( 'mi->km', Unit_Flip_Units::convert( 1, 'mi', 'km' ), 1.609344 );
near( 'lb->kg', Unit_Flip_Units::convert( 1, 'lb', 'kg' ), 0.45359237 );
near( 'cup->ml', Unit_Flip_Units::convert( 1, 'cup', 'ml' ), 236.5882365 );
near( 'mpg->l100', Unit_Flip_Units::convert( 30, 'mpg', 'l100' ), 7.84048610 );
near( 'l100->mpg', Unit_Flip_Units::convert( 7.84048610, 'l100', 'mpg' ), 30 );
near( 'psi->bar', Unit_Flip_Units::convert( 32, 'psi', 'bar' ), 2.20632233 );
eq( 'incompatible', Unit_Flip_Units::convert( 1, 'kg', 'm' ), null );
eq( 'unknown', Unit_Flip_Units::convert( 1, 'xx', 'm' ), null );
eq( 'nonnumeric', Unit_Flip_Units::convert( 'abc', 'm', 'ft' ), null );
eq( 'norm °F', Unit_Flip_Units::normalize( '°F' ), 'F' );
eq( 'norm lbs', Unit_Flip_Units::normalize( 'lbs' ), 'lb' );
eq( 'norm km/h', Unit_Flip_Units::normalize( 'km/h' ), 'kmh' );
eq( 'norm KG', Unit_Flip_Units::normalize( 'KG' ), 'kg' );
eq( 'norm Cups', Unit_Flip_Units::normalize( 'Cups' ), 'cup' );
eq( 'format trim', Unit_Flip_Units::format( 2.5, 2 ), '2.5' );
eq( 'format int', Unit_Flip_Units::format( 3.0, 2 ), '3' );
eq( 'format small', Unit_Flip_Units::format( 0.004, 1 ), '0.004' );
eq( 'format inf', Unit_Flip_Units::format( INF, 1 ), '∞' );
eq( 'sc default', Unit_Flip::shortcode_value( array( 'value' => '350', 'from' => 'F' ) ), '<span class="unit-flip">350 °F <span class="unit-flip__alt">(176.7 °C)</span></span>' );
eq( 'sc comma', Unit_Flip::shortcode_value( array( 'value' => '1,5', 'from' => 'kg', 'decimals' => '2' ) ), '<span class="unit-flip">1.5 kg <span class="unit-flip__alt">(3.31 lb)</span></span>' );
eq( 'sc slash', Unit_Flip::shortcode_value( array( 'value' => '2', 'from' => 'cups', 'to' => 'ml', 'style' => 'slash' ) ), '<span class="unit-flip">2 cups <span class="unit-flip__alt">/ 473.2 ml</span></span>' );
eq( 'sc result', Unit_Flip::shortcode_value( array( 'value' => '10', 'from' => 'km', 'style' => 'result' ) ), '<span class="unit-flip" title="10 km">6.2 mi</span>' );
eq( 'sc typo', Unit_Flip::shortcode_value( array( 'value' => '5', 'from' => 'parsecs<b>' ) ), '5 parsecs&lt;b&gt;' );
eq( 'sc xss value', Unit_Flip::shortcode_value( array( 'value' => '"><script>', 'from' => 'm' ) ), '&quot;&gt;&lt;script&gt; m' );
foreach ( Unit_Flip_Units::table() as $cat => $units ) {
	foreach ( array_keys( $units ) as $u ) {
		$c = Unit_Flip::counterpart( $u );
		if ( '' !== $c ) { eq( "counterpart $u->$c same category", Unit_Flip_Units::category_of( $c ), $cat ); }
		foreach ( array_keys( $units ) as $v ) {
			$r = Unit_Flip_Units::convert( Unit_Flip_Units::convert( 7.5, $u, $v ), $v, $u );
			near( "roundtrip $u<->$v", $r, 7.5, 1e-9 );
		}
	}
}
if ( getenv( 'UF_PRO' ) ) {
	require __DIR__ . '/pro.php';
}
echo "$n checks, $fails failed\n";
exit( $fails ? 1 : 0 );
