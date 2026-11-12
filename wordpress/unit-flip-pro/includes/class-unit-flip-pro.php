<?php
/**
 * Automatic conversions, visitor switch and ingredient weights.
 *
 * @package Unit_Flip_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Pro features.
 */
class Unit_Flip_Pro {

	const OPTION = 'unit_flip_pro_settings';

	/**
	 * Words in text => unit key.
	 *
	 * @var array<string, string>
	 */
	private static $words = array(
		'°f' => 'F', '° f' => 'F', 'degrees f' => 'F', 'degrees fahrenheit' => 'F', 'f' => 'F',
		'°c' => 'C', '° c' => 'C', 'degrees c' => 'C', 'degrees celsius' => 'C', 'c' => 'C',
		'cup' => 'cup', 'cups' => 'cup',
		'tbsp' => 'tbsp', 'tablespoon' => 'tbsp', 'tablespoons' => 'tbsp',
		'tsp' => 'tsp', 'teaspoon' => 'tsp', 'teaspoons' => 'tsp',
		'fl oz' => 'floz', 'fl. oz' => 'floz', 'fl. oz.' => 'floz',
		'oz' => 'oz', 'ounce' => 'oz', 'ounces' => 'oz',
		'lb' => 'lb', 'lbs' => 'lb', 'pound' => 'lb', 'pounds' => 'lb',
		'g' => 'g', 'gram' => 'g', 'grams' => 'g', 'kg' => 'kg', 'kilogram' => 'kg', 'kilograms' => 'kg',
		'ml' => 'ml', 'milliliters' => 'ml', 'millilitres' => 'ml', 'l' => 'l', 'liter' => 'l', 'liters' => 'l', 'litre' => 'l', 'litres' => 'l',
		'inch' => 'in', 'inches' => 'in', 'in.' => 'in', 'ft' => 'ft', 'feet' => 'ft', 'foot' => 'ft',
		'mile' => 'mi', 'miles' => 'mi', 'km' => 'km', 'kilometers' => 'km', 'kilometres' => 'km',
		'cm' => 'cm', 'mm' => 'mm', 'm' => 'm', 'meters' => 'm', 'metres' => 'm',
		'mph' => 'mph', 'km/h' => 'kmh', 'kph' => 'kmh',
	);

	/**
	 * Hooks.
	 */
	public static function init() {
		$s = self::settings();
		if ( $s['auto'] ) {
			// Before wpautop (10) and shortcodes (11), so existing shortcodes are left alone.
			add_filter( 'the_content', array( __CLASS__, 'filter_content' ), 8 );
		}
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 20 );
	}

	/**
	 * Settings merged with defaults.
	 *
	 * @return array{auto:bool, ingredients:bool, switch:string}
	 */
	public static function settings() {
		$saved = get_option( self::OPTION, array() );
		$saved = is_array( $saved ) ? $saved : array();
		$s     = wp_parse_args(
			$saved,
			array(
				'auto'        => 1,
				'ingredients' => 1,
				'switch'      => 'top',
			)
		);
		$s['auto']        = (bool) $s['auto'];
		$s['ingredients'] = (bool) $s['ingredients'];
		return $s;
	}

	/**
	 * Grams per US cup for common ingredients (approximate, typical published baking values).
	 *
	 * @return array<string, float>
	 */
	public static function densities() {
		return apply_filters(
			'unit_flip_pro_densities',
			array(
				'all-purpose flour' => 120,
				'bread flour'       => 120,
				'whole wheat flour' => 113,
				'almond flour'      => 96,
				'flour'             => 120,
				'granulated sugar'  => 200,
				'brown sugar'       => 213,
				'powdered sugar'    => 113,
				'icing sugar'       => 113,
				'sugar'             => 200,
				'butter'            => 227,
				'cocoa powder'      => 84,
				'cocoa'             => 84,
				'rolled oats'       => 89,
				'oats'              => 89,
				'rice'              => 185,
				'milk'              => 227,
				'water'             => 236,
				'heavy cream'       => 232,
				'honey'             => 336,
				'maple syrup'       => 312,
				'vegetable oil'     => 198,
				'olive oil'         => 200,
				'oil'               => 198,
				'cornstarch'        => 112,
				'chocolate chips'   => 170,
				'yogurt'            => 227,
				'salt'              => 288,
			)
		);
	}

	/**
	 * Registers assets and the switch shortcode.
	 */
	public static function register() {
		wp_register_script( 'unit-flip-pro', UNIT_FLIP_PRO_URL_BASE . 'assets/switch.js', array(), UNIT_FLIP_PRO_VERSION, true );
		wp_register_style( 'unit-flip-pro', UNIT_FLIP_PRO_URL_BASE . 'assets/switch.css', array( 'unit-flip' ), UNIT_FLIP_PRO_VERSION );
		add_shortcode( 'unitflip_switch', array( __CLASS__, 'switch_html' ) );
	}

	/**
	 * Metric/imperial switch markup.
	 *
	 * @return string
	 */
	public static function switch_html() {
		wp_enqueue_script( 'unit-flip-pro' );
		wp_enqueue_style( 'unit-flip-pro' );
		return '<div class="unit-flip-switch" role="group" aria-label="' . esc_attr__( 'Units', 'unit-flip-pro' ) . '">'
			. '<button type="button" data-uf-pick="both" aria-pressed="true">' . esc_html__( 'Both', 'unit-flip-pro' ) . '</button>'
			. '<button type="button" data-uf-pick="metric" aria-pressed="false">' . esc_html__( 'Metric', 'unit-flip-pro' ) . '</button>'
			. '<button type="button" data-uf-pick="imperial" aria-pressed="false">' . esc_html__( 'US', 'unit-flip-pro' ) . '</button>'
			. '</div>';
	}

	/**
	 * Parses "1", "1.5", "1,5", "1/2", "1 1/2", "½", "1½".
	 *
	 * @param string $s Number text.
	 * @return float|null
	 */
	public static function parse_number( $s ) {
		$fr = array( '½' => 0.5, '¼' => 0.25, '¾' => 0.75, '⅓' => 1 / 3, '⅔' => 2 / 3, '⅛' => 0.125 );
		$s  = trim( $s );
		$total = 0.0;
		foreach ( $fr as $glyph => $val ) {
			if ( false !== strpos( $s, $glyph ) ) {
				$total += $val;
				$s      = trim( str_replace( $glyph, '', $s ) );
			}
		}
		if ( preg_match( '/^(?:(\d+)\s+)?(\d+)\/(\d+)$/', $s, $m ) ) {
			if ( 0 === (int) $m[3] ) {
				return null;
			}
			return $total + (float) ( '' !== $m[1] ? $m[1] : 0 ) + (int) $m[2] / (int) $m[3];
		}
		if ( '' === $s ) {
			return $total > 0 ? $total : null;
		}
		$s = str_replace( ',', '.', $s );
		return is_numeric( $s ) ? $total + (float) $s : null;
	}

	/**
	 * Regex for "number unit [ingredient]".
	 *
	 * @return string
	 */
	private static function pattern() {
		$words = array_keys( self::$words );
		usort(
			$words,
			function ( $a, $b ) {
				return strlen( $b ) - strlen( $a );
			}
		);
		$units = implode( '|', array_map( 'preg_quote', $words, array_fill( 0, count( $words ), '/' ) ) );
		$ingr  = array_keys( self::densities() );
		usort(
			$ingr,
			function ( $a, $b ) {
				return strlen( $b ) - strlen( $a );
			}
		);
		$ingr = implode( '|', array_map( 'preg_quote', $ingr, array_fill( 0, count( $ingr ), '/' ) ) );
		$num  = '(?:\d+\s+\d+\/\d+|\d+\/\d+|\d*[½¼¾⅓⅔⅛]|\d+(?:[.,]\d+)?)';
		return '/(?<![\w.,\/])(' . $num . ')(?:\s?|\s?-)(' . $units . ')(?![\w°])(?:(\s+(?:of\s+)?)(' . $ingr . ')\b)?/iu';
	}

	/**
	 * Adds conversions to measurements in post content.
	 *
	 * @param string $content HTML.
	 * @return string
	 */
	public static function filter_content( $content ) {
		if ( ! is_string( $content ) || '' === $content || ( function_exists( 'is_feed' ) && is_feed() ) ) {
			return $content;
		}
		$parts = preg_split(
			'/(<!--.*?-->|<(code|pre|script|style|textarea|kbd)\b.*?<\/\2>|<[^>]+>|\[[^\]]*\])/is',
			$content,
			-1,
			PREG_SPLIT_DELIM_CAPTURE
		);
		if ( false === $parts ) {
			return $content;
		}
		$out   = '';
		$found = false;
		$skip_next = false;
		$count = count( $parts );
		for ( $i = 0; $i < $count; $i++ ) {
			$p = $parts[ $i ];
			if ( $skip_next ) {
				// Second capture group (tag name) from the split; not real content.
				$skip_next = false;
				continue;
			}
			if ( '' !== $p && ( '<' === $p[0] || '[' === $p[0] ) ) {
				$out .= $p;
				if ( preg_match( '/^<(code|pre|script|style|textarea|kbd)\b/i', $p ) ) {
					$skip_next = true;
				}
				continue;
			}
			$new = self::convert_text( $p );
			if ( $new !== $p ) {
				$found = true;
			}
			$out .= $new;
		}
		if ( $found ) {
			wp_enqueue_style( 'unit-flip' );
			wp_enqueue_script( 'unit-flip-pro' );
			wp_enqueue_style( 'unit-flip-pro' );
			if ( 'top' === self::settings()['switch'] && false === strpos( $content, '[unitflip_switch' ) ) {
				$out = self::switch_html() . $out;
			}
		}
		return $out;
	}

	/**
	 * Converts measurements in a plain text fragment.
	 *
	 * @param string $text Text (may contain entities).
	 * @return string
	 */
	public static function convert_text( $text ) {
		$s        = self::settings();
		$base     = Unit_Flip::settings();
		$decimals = (int) $base['decimals'];
		return (string) preg_replace_callback(
			self::pattern(),
			function ( $m ) use ( $s, $decimals ) {
				$whole = $m[0];
				$word  = strtolower( preg_replace( '/\s+/', ' ', $m[2] ) );
				$unit  = isset( self::$words[ $word ] ) ? self::$words[ $word ] : '';
				// Bare "F"/"C" only count when written directly after the number with a degree sign elsewhere; skip "5 c".
				if ( in_array( $word, array( 'f', 'c' ), true ) && ! preg_match( '/°/u', $m[2] ) && ! preg_match( '/\d(F|C)$/', $m[1] . $m[2] ) ) {
					return $whole;
				}
				// Uppercase L only for litres; "5 l" is too ambiguous in prose.
				if ( 'l' === $word && 'L' !== $m[2] ) {
					return $whole;
				}
				$value = self::parse_number( $m[1] );
				if ( '' === $unit || null === $value ) {
					return $whole;
				}
				$ingredient = isset( $m[4] ) ? strtolower( $m[4] ) : '';
				$dens       = self::densities();
				if ( $s['ingredients'] && '' !== $ingredient && isset( $dens[ $ingredient ] ) && in_array( $unit, array( 'cup', 'tbsp', 'tsp' ), true ) ) {
					$cups  = Unit_Flip_Units::convert( $value, $unit, 'cup' );
					$grams = $cups * $dens[ $ingredient ];
					$alt   = Unit_Flip_Units::format( $grams, $grams >= 10 ? 0 : 1 ) . ' g';
					return self::wrap( $whole, $alt, 'imperial' );
				}
				$to = Unit_Flip::counterpart( $unit );
				if ( '' === $to ) {
					return $whole;
				}
				$res = Unit_Flip_Units::convert( $value, $unit, $to );
				if ( null === $res ) {
					return $whole;
				}
				$metric = array( 'C', 'g', 'kg', 'ml', 'l', 'cm', 'mm', 'm', 'km', 'kmh' );
				$alt    = Unit_Flip_Units::format( $res, in_array( $unit, array( 'F', 'C' ), true ) ? 0 : $decimals ) . ' ' . Unit_Flip_Units::symbol( $to );
				return self::wrap( $whole, $alt, in_array( $unit, $metric, true ) ? 'metric' : 'imperial' );
			},
			$text
		);
	}

	/**
	 * Wraps a measurement with its conversion.
	 *
	 * @param string $orig   Original text (already HTML from content).
	 * @param string $alt    Converted text.
	 * @param string $system System of the original: metric|imperial.
	 * @return string
	 */
	private static function wrap( $orig, $alt, $system ) {
		return '<span class="unit-flip unit-flip--auto" data-uf-system="' . esc_attr( $system ) . '" data-uf-alt="' . esc_attr( $alt ) . '">'
			. '<span class="unit-flip__orig">' . $orig . '</span> <span class="unit-flip__alt">(' . esc_html( $alt ) . ')</span></span>';
	}

	/**
	 * Settings section under Settings > Unit Flip Pro.
	 */
	public static function menu() {
		add_options_page( __( 'Unit Flip Pro', 'unit-flip-pro' ), __( 'Unit Flip Pro', 'unit-flip-pro' ), 'manage_options', 'unit-flip-pro', array( __CLASS__, 'page' ) );
	}

	/**
	 * Registers the option.
	 */
	public static function register_settings() {
		register_setting(
			'unit_flip_pro',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => function ( $in ) {
					$in = is_array( $in ) ? $in : array();
					$sw = isset( $in['switch'] ) ? sanitize_key( $in['switch'] ) : 'top';
					return array(
						'auto'        => empty( $in['auto'] ) ? 0 : 1,
						'ingredients' => empty( $in['ingredients'] ) ? 0 : 1,
						'switch'      => in_array( $sw, array( 'top', 'none' ), true ) ? $sw : 'top',
					);
				},
			)
		);
	}

	/**
	 * Settings page.
	 */
	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s = self::settings();
		$o = self::OPTION;
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Unit Flip Pro', 'unit-flip-pro' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'unit_flip_pro' ); ?>
				<p><label><input type="checkbox" name="<?php echo esc_attr( $o ); ?>[auto]" value="1" <?php checked( $s['auto'] ); ?>> <?php esc_html_e( 'Convert measurements in posts and pages automatically', 'unit-flip-pro' ); ?></label></p>
				<p><label><input type="checkbox" name="<?php echo esc_attr( $o ); ?>[ingredients]" value="1" <?php checked( $s['ingredients'] ); ?>> <?php esc_html_e( 'Show grams for cups/spoons of known ingredients (e.g. "2 cups flour (240 g)")', 'unit-flip-pro' ); ?></label></p>
				<p><label><input type="radio" name="<?php echo esc_attr( $o ); ?>[switch]" value="top" <?php checked( $s['switch'], 'top' ); ?>> <?php esc_html_e( 'Show the Metric/US switch above content that has conversions', 'unit-flip-pro' ); ?></label><br>
				<label><input type="radio" name="<?php echo esc_attr( $o ); ?>[switch]" value="none" <?php checked( $s['switch'], 'none' ); ?>> <?php esc_html_e( 'Only where I place [unitflip_switch]', 'unit-flip-pro' ); ?></label></p>
				<?php submit_button(); ?>
			</form>
			<p><?php esc_html_e( 'Text inside code blocks, shortcodes and HTML attributes is never changed. Ingredient weights are typical approximate values; adjust them with the unit_flip_pro_densities filter.', 'unit-flip-pro' ); ?></p>
		</div>
		<?php
	}
}
