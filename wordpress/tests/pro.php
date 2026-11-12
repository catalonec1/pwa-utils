<?php
/* Pro add-on checks; included by run.php when UF_PRO=1. */
eq( 'num 1/2', Unit_Flip_Pro::parse_number( '1/2' ), 0.5 );
eq( 'num 1 1/2', Unit_Flip_Pro::parse_number( '1 1/2' ), 1.5 );
eq( 'num ½', Unit_Flip_Pro::parse_number( '½' ), 0.5 );
eq( 'num 2½', Unit_Flip_Pro::parse_number( '2½' ), 2.5 );
eq( 'num 1,5', Unit_Flip_Pro::parse_number( '1,5' ), 1.5 );
eq( 'num 1/0', Unit_Flip_Pro::parse_number( '1/0' ), null );

$w = function ( $orig, $alt, $sys ) {
	return '<span class="unit-flip unit-flip--auto" data-uf-system="' . $sys . '" data-uf-alt="' . htmlspecialchars( $alt, ENT_QUOTES ) . '"><span class="unit-flip__orig">' . $orig . '</span> <span class="unit-flip__alt">(' . htmlspecialchars( $alt, ENT_QUOTES ) . ')</span></span>';
};
eq( 'oven', Unit_Flip_Pro::convert_text( 'Bake at 350°F for 20 min.' ), 'Bake at ' . $w( '350°F', '177 °C', 'imperial' ) . ' for 20 min.' );
eq( 'flour', Unit_Flip_Pro::convert_text( 'Add 2 cups flour.' ), 'Add ' . $w( '2 cups flour', '240 g', 'imperial' ) . '.' );
eq( 'sugar of', Unit_Flip_Pro::convert_text( '1/2 cup of sugar' ), $w( '1/2 cup of sugar', '100 g', 'imperial' ) );
eq( 'tbsp butter', Unit_Flip_Pro::convert_text( '2 tbsp butter' ), $w( '2 tbsp butter', '28 g', 'imperial' ) );
eq( 'cups plain', Unit_Flip_Pro::convert_text( '3 cups' ), $w( '3 cups', '709.8 ml', 'imperial' ) );
eq( 'metric kg', Unit_Flip_Pro::convert_text( 'a 5 kg bag' ), 'a ' . $w( '5 kg', '11 lb', 'metric' ) . ' bag' );
eq( 'miles', Unit_Flip_Pro::convert_text( 'We hiked 12 miles.' ), 'We hiked ' . $w( '12 miles', '19.3 km', 'imperial' ) . '.' );
eq( 'no in', Unit_Flip_Pro::convert_text( 'Put 5 in the bowl' ), 'Put 5 in the bowl' );
eq( 'no 5 c', Unit_Flip_Pro::convert_text( 'Option 5 c is right' ), 'Option 5 c is right' );
eq( 'no lower l', Unit_Flip_Pro::convert_text( 'room 2 l' ), 'room 2 l' );
eq( 'no version', Unit_Flip_Pro::convert_text( 'version 2.5m' ), 'version ' . $w( '2.5m', '8.2 ft', 'metric' ) );
eq( 'no word g', Unit_Flip_Pro::convert_text( '4 guests' ), '4 guests' );
eq( 'no mid number', Unit_Flip_Pro::convert_text( 'A1 5x' ), 'A1 5x' );

$GLOBALS['uf_filters'] = array();
$html = '<p>Bake at 200°C.</p><pre>x = 5 kg</pre><a href="/5-kg">link</a>[unitflip value="3" from="lb"]<!-- 7 kg -->';
$res  = Unit_Flip_Pro::filter_content( $html );
eq( 'content code untouched', false !== strpos( $res, '<pre>x = 5 kg</pre>' ), true );
eq( 'content comment untouched', false !== strpos( $res, '<!-- 7 kg -->' ), true );
eq( 'content shortcode untouched', false !== strpos( $res, '[unitflip value="3" from="lb"]' ), true );
eq( 'content href untouched', false !== strpos( $res, 'href="/5-kg"' ), true );
eq( 'content converted', false !== strpos( $res, '(392 °F)' ), true );
eq( 'content switch', 0 === strpos( $res, '<div class="unit-flip-switch"' ), true );
eq( 'content no match unchanged', Unit_Flip_Pro::filter_content( '<p>Hello</p>' ), '<p>Hello</p>' );
