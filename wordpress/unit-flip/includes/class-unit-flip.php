<?php
/**
 * Shortcodes, block and front-end assets.
 *
 * @package Unit_Flip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Front-end features.
 */
class Unit_Flip {

	const OPTION = 'unit_flip_settings';

	/**
	 * Default metric <-> imperial counterparts, used when `to` is omitted.
	 *
	 * @var array<string, string>
	 */
	private static $counterparts = array(
		'C'    => 'F',
		'F'    => 'C',
		'mm'   => 'in',
		'cm'   => 'in',
		'm'    => 'ft',
		'km'   => 'mi',
		'in'   => 'cm',
		'ft'   => 'm',
		'yd'   => 'm',
		'mi'   => 'km',
		'g'    => 'oz',
		'kg'   => 'lb',
		'oz'   => 'g',
		'lb'   => 'kg',
		'st'   => 'kg',
		'ml'   => 'floz',
		'l'    => 'qt',
		'tsp'  => 'ml',
		'tbsp' => 'ml',
		'cup'  => 'ml',
		'floz' => 'ml',
		'pt'   => 'ml',
		'qt'   => 'l',
		'gal'  => 'l',
		'm2'   => 'ft2',
		'ft2'  => 'm2',
		'ha'   => 'ac',
		'ac'   => 'ha',
		'km2'  => 'mi2',
		'mi2'  => 'km2',
		'kmh'  => 'mph',
		'mph'  => 'kmh',
		'bar'  => 'psi',
		'psi'  => 'bar',
		'kW'   => 'hp',
		'hp'   => 'kW',
		'l100' => 'mpg',
		'mpg'  => 'l100',
		'kcal' => 'kJ',
		'kJ'   => 'kcal',
	);

	/**
	 * Hooks everything up.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
	}

	/**
	 * Returns the saved settings merged with defaults.
	 *
	 * @return array{decimals:int, style:string}
	 */
	public static function settings() {
		$saved = get_option( self::OPTION, array() );
		$saved = is_array( $saved ) ? $saved : array();
		return wp_parse_args(
			$saved,
			array(
				'decimals' => 1,
				'style'    => 'parentheses',
			)
		);
	}

	/**
	 * Default target unit for a source unit.
	 *
	 * @param string $from Unit key.
	 * @return string
	 */
	public static function counterpart( $from ) {
		$map = apply_filters( 'unit_flip_counterparts', self::$counterparts );
		return isset( $map[ $from ] ) ? $map[ $from ] : '';
	}

	/**
	 * Registers shortcodes, assets and the block.
	 */
	public static function register() {
		add_shortcode( 'unitflip', array( __CLASS__, 'shortcode_value' ) );
		add_shortcode( 'unitflip_converter', array( __CLASS__, 'shortcode_converter' ) );

		wp_register_style( 'unit-flip', UNIT_FLIP_URL . 'assets/unit-flip.css', array(), UNIT_FLIP_VERSION );
		wp_register_script( 'unit-flip-converter', UNIT_FLIP_URL . 'assets/converter.js', array(), UNIT_FLIP_VERSION, true );

		$table   = Unit_Flip_Units::table();
		$symbols = array();
		foreach ( $table as $units ) {
			foreach ( array_keys( $units ) as $u ) {
				$symbols[ $u ] = Unit_Flip_Units::symbol( $u );
			}
		}
		wp_add_inline_script(
			'unit-flip-converter',
			'window.unitFlipData = ' . wp_json_encode(
				array(
					'units'   => $table,
					'symbols' => $symbols,
					'labels'  => self::category_labels(),
					'i18n'    => array(
						'value' => __( 'Value', 'unit-flip' ),
						'from'  => __( 'From', 'unit-flip' ),
						'to'    => __( 'To', 'unit-flip' ),
						'swap'  => __( 'Swap units', 'unit-flip' ),
					),
				)
			) . ';',
			'before'
		);

		wp_register_script(
			'unit-flip-block-editor',
			UNIT_FLIP_URL . 'blocks/converter/editor.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
			UNIT_FLIP_VERSION,
			true
		);
		wp_add_inline_script(
			'unit-flip-block-editor',
			'window.unitFlipCategories = ' . wp_json_encode( self::category_labels() ) . ';',
			'before'
		);
		wp_set_script_translations( 'unit-flip-block-editor', 'unit-flip' );

		register_block_type(
			UNIT_FLIP_DIR . 'blocks/converter',
			array( 'render_callback' => array( __CLASS__, 'render_block' ) )
		);
	}

	/**
	 * Human-readable category names.
	 *
	 * @return array<string, string>
	 */
	public static function category_labels() {
		$labels = array(
			'length'      => __( 'Length', 'unit-flip' ),
			'mass'        => __( 'Weight', 'unit-flip' ),
			'temperature' => __( 'Temperature', 'unit-flip' ),
			'volume'      => __( 'Volume', 'unit-flip' ),
			'area'        => __( 'Area', 'unit-flip' ),
			'speed'       => __( 'Speed', 'unit-flip' ),
			'pressure'    => __( 'Pressure', 'unit-flip' ),
			'energy'      => __( 'Energy', 'unit-flip' ),
			'power'       => __( 'Power', 'unit-flip' ),
			'fuel'        => __( 'Fuel economy', 'unit-flip' ),
			'data'        => __( 'Data size', 'unit-flip' ),
		);
		$labels = apply_filters( 'unit_flip_category_labels', $labels );
		return array_intersect_key( $labels, Unit_Flip_Units::table() );
	}

	/**
	 * Formats "350 °F (177 °C)" style output. Returns null when the units are invalid.
	 *
	 * @param float  $value    Value.
	 * @param string $from     Unit key.
	 * @param string $to       Unit key.
	 * @param int    $decimals Decimals.
	 * @param string $style    parentheses|slash|result.
	 * @return string|null HTML.
	 */
	public static function render_value( $value, $from, $to, $decimals, $style ) {
		$result = Unit_Flip_Units::convert( $value, $from, $to );
		if ( null === $result ) {
			return null;
		}
		$orig = Unit_Flip_Units::format( (float) $value, 6 ) . ' ' . Unit_Flip_Units::symbol( $from );
		$alt  = Unit_Flip_Units::format( $result, $decimals ) . ' ' . Unit_Flip_Units::symbol( $to );

		if ( 'result' === $style ) {
			$html = '<span class="unit-flip" title="' . esc_attr( $orig ) . '">' . esc_html( $alt ) . '</span>';
		} elseif ( 'slash' === $style ) {
			$html = '<span class="unit-flip">' . esc_html( $orig ) . ' <span class="unit-flip__alt">/ ' . esc_html( $alt ) . '</span></span>';
		} else {
			$html = '<span class="unit-flip">' . esc_html( $orig ) . ' <span class="unit-flip__alt">(' . esc_html( $alt ) . ')</span></span>';
		}
		return $html;
	}

	/**
	 * [unitflip value="350" from="F" to="C" decimals="0" style="parentheses"]
	 *
	 * @param array|string $atts Attributes.
	 * @return string
	 */
	public static function shortcode_value( $atts ) {
		$s    = self::settings();
		$atts = shortcode_atts(
			array(
				'value'    => '',
				'from'     => '',
				'to'       => '',
				'decimals' => $s['decimals'],
				'style'    => $s['style'],
			),
			$atts,
			'unitflip'
		);

		$value = str_replace( ',', '.', trim( (string) $atts['value'] ) );
		$from  = Unit_Flip_Units::normalize( $atts['from'] );
		$to    = '' !== $atts['to'] ? Unit_Flip_Units::normalize( $atts['to'] ) : self::counterpart( $from );
		$style = in_array( $atts['style'], array( 'parentheses', 'slash', 'result' ), true ) ? $atts['style'] : 'parentheses';

		$html = self::render_value( $value, $from, $to, (int) $atts['decimals'], $style );
		if ( null === $html ) {
			// Invalid input: show the original text so the post still reads correctly.
			return esc_html( trim( $atts['value'] . ' ' . $atts['from'] ) );
		}
		wp_enqueue_style( 'unit-flip' );
		return $html;
	}

	/**
	 * [unitflip_converter category="length" from="m" to="ft"]
	 *
	 * @param array|string $atts Attributes.
	 * @return string
	 */
	public static function shortcode_converter( $atts ) {
		$atts = shortcode_atts(
			array(
				'category' => 'length',
				'from'     => '',
				'to'       => '',
				'value'    => '1',
			),
			$atts,
			'unitflip_converter'
		);
		return self::converter_html( $atts );
	}

	/**
	 * Block render callback.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function render_block( $attributes ) {
		$atts = array(
			'category' => isset( $attributes['category'] ) ? $attributes['category'] : 'length',
			'from'     => '',
			'to'       => '',
			'value'    => '1',
		);
		$wrapper = function_exists( 'get_block_wrapper_attributes' ) ? get_block_wrapper_attributes() : '';
		return '<div ' . $wrapper . '>' . self::converter_html( $atts ) . '</div>';
	}

	/**
	 * Markup for the interactive converter; converter.js builds the controls.
	 *
	 * @param array $atts category, from, to, value.
	 * @return string
	 */
	private static function converter_html( $atts ) {
		$table    = Unit_Flip_Units::table();
		$category = sanitize_key( $atts['category'] );
		if ( ! isset( $table[ $category ] ) ) {
			$category = 'length';
		}
		$units = array_keys( $table[ $category ] );
		$from  = Unit_Flip_Units::normalize( $atts['from'] );
		$from  = in_array( $from, $units, true ) ? $from : $units[0];
		$to    = Unit_Flip_Units::normalize( $atts['to'] );
		if ( ! in_array( $to, $units, true ) ) {
			$guess = self::counterpart( $from );
			$to    = in_array( $guess, $units, true ) ? $guess : $units[ min( 1, count( $units ) - 1 ) ];
		}
		$value = is_numeric( $atts['value'] ) ? $atts['value'] : '1';
		$labels = self::category_labels();

		wp_enqueue_style( 'unit-flip' );
		wp_enqueue_script( 'unit-flip-converter' );

		return sprintf(
			'<div class="unit-flip-converter" data-category="%1$s" data-from="%2$s" data-to="%3$s" data-value="%4$s"><noscript>%5$s</noscript></div>',
			esc_attr( $category ),
			esc_attr( $from ),
			esc_attr( $to ),
			esc_attr( $value ),
			esc_html(
				sprintf(
					/* translators: %s: category name such as Length. */
					__( '%s converter (needs JavaScript).', 'unit-flip' ),
					isset( $labels[ $category ] ) ? $labels[ $category ] : $category
				)
			)
		);
	}
}
