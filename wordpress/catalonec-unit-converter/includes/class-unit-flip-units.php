<?php
/**
 * Unit table and conversion math.
 *
 * Linear units store their factor to the category's base unit.
 * Temperature and fuel economy are not linear and are handled separately.
 *
 * @package Unit_Flip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Converts values between units.
 */
class Unit_Flip_Units {

	/**
	 * Returns the category table.
	 *
	 * @return array<string, array<string, float|null>>
	 */
	public static function table() {
		static $table = null;
		if ( null !== $table ) {
			return $table;
		}
		$table = array(
			'length'      => array( 'mm' => 0.001, 'cm' => 0.01, 'm' => 1, 'km' => 1000, 'in' => 0.0254, 'ft' => 0.3048, 'yd' => 0.9144, 'mi' => 1609.344, 'nmi' => 1852 ),
			'mass'        => array( 'mg' => 1e-6, 'g' => 0.001, 'kg' => 1, 't' => 1000, 'oz' => 0.028349523125, 'lb' => 0.45359237, 'st' => 6.35029318 ),
			'temperature' => array( 'C' => null, 'F' => null, 'K' => null ),
			'volume'      => array( 'ml' => 0.001, 'l' => 1, 'm3' => 1000, 'tsp' => 0.00492892159375, 'tbsp' => 0.01478676478125, 'cup' => 0.2365882365, 'floz' => 0.0295735295625, 'pt' => 0.473176473, 'qt' => 0.946352946, 'gal' => 3.785411784, 'galUK' => 4.54609 ),
			'area'        => array( 'cm2' => 1e-4, 'm2' => 1, 'ha' => 1e4, 'km2' => 1e6, 'in2' => 0.00064516, 'ft2' => 0.09290304, 'ac' => 4046.8564224, 'mi2' => 2589988.110336 ),
			'speed'       => array( 'mps' => 1, 'kmh' => 1 / 3.6, 'mph' => 0.44704, 'kn' => 1852 / 3600 ),
			'pressure'    => array( 'Pa' => 1, 'kPa' => 1000, 'bar' => 1e5, 'atm' => 101325, 'psi' => 6894.757293168, 'mmHg' => 133.322387415 ),
			'energy'      => array( 'J' => 1, 'kJ' => 1000, 'cal' => 4.184, 'kcal' => 4184, 'Wh' => 3600, 'kWh' => 3.6e6, 'BTU' => 1055.05585262 ),
			'power'       => array( 'W' => 1, 'kW' => 1000, 'hp' => 745.69987158227, 'PS' => 735.49875 ),
			'fuel'        => array( 'l100' => null, 'kml' => null, 'mpg' => null, 'mpgUK' => null ),
			'data'        => array( 'B' => 1, 'KB' => 1e3, 'MB' => 1e6, 'GB' => 1e9, 'TB' => 1e12, 'KiB' => 1024, 'MiB' => 1048576, 'GiB' => 1073741824 ),
		);
		/**
		 * Filters the unit table. Add-ons can register categories or units here.
		 *
		 * @param array $table Category => ( unit => factor to base ).
		 */
		$table = apply_filters( 'unit_flip_units', $table );
		return $table;
	}

	/**
	 * Display symbols for unit keys.
	 *
	 * @param string $unit Unit key.
	 * @return string
	 */
	public static function symbol( $unit ) {
		$symbols = array(
			'C'     => '°C',
			'F'     => '°F',
			'K'     => 'K',
			'm3'    => 'm³',
			'cm2'   => 'cm²',
			'm2'    => 'm²',
			'km2'   => 'km²',
			'in2'   => 'in²',
			'ft2'   => 'ft²',
			'mi2'   => 'mi²',
			'mps'   => 'm/s',
			'kmh'   => 'km/h',
			'floz'  => 'fl oz',
			'gal'   => 'gal',
			'galUK' => 'gal (UK)',
			'l100'  => 'L/100 km',
			'kml'   => 'km/L',
			'mpg'   => 'mpg',
			'mpgUK' => 'mpg (UK)',
			'cup'   => 'cups',
		);
		$symbols = apply_filters( 'unit_flip_symbols', $symbols );
		return isset( $symbols[ $unit ] ) ? $symbols[ $unit ] : $unit;
	}

	/**
	 * Finds the category of a unit key, or '' when unknown.
	 *
	 * @param string $unit Unit key.
	 * @return string
	 */
	public static function category_of( $unit ) {
		foreach ( self::table() as $cat => $units ) {
			if ( array_key_exists( $unit, $units ) ) {
				return $cat;
			}
		}
		return '';
	}

	/**
	 * Normalizes user-typed unit names (e.g. "°F", "lbs", "km/h") to unit keys.
	 *
	 * @param string $unit Raw unit.
	 * @return string
	 */
	public static function normalize( $unit ) {
		$unit = trim( (string) $unit );
		$aliases = array(
			'°c' => 'C', 'c' => 'C', 'celsius' => 'C',
			'°f' => 'F', 'f' => 'F', 'fahrenheit' => 'F',
			'kelvin' => 'K',
			'lbs' => 'lb', 'pound' => 'lb', 'pounds' => 'lb',
			'ounce' => 'oz', 'ounces' => 'oz',
			'gram' => 'g', 'grams' => 'g', 'kilogram' => 'kg', 'kilograms' => 'kg', 'kgs' => 'kg',
			'inch' => 'in', 'inches' => 'in', '"' => 'in',
			'foot' => 'ft', 'feet' => 'ft', "'" => 'ft',
			'yard' => 'yd', 'yards' => 'yd',
			'mile' => 'mi', 'miles' => 'mi',
			'meter' => 'm', 'meters' => 'm', 'metre' => 'm', 'metres' => 'm',
			'cups' => 'cup',
			'tablespoon' => 'tbsp', 'tablespoons' => 'tbsp', 'tbs' => 'tbsp',
			'teaspoon' => 'tsp', 'teaspoons' => 'tsp',
			'fl oz' => 'floz', 'fl. oz' => 'floz',
			'liter' => 'l', 'liters' => 'l', 'litre' => 'l', 'litres' => 'l', 'L' => 'l',
			'ml' => 'ml', 'mL' => 'ml',
			'km/h' => 'kmh', 'kph' => 'kmh', 'm/s' => 'mps',
			'gallon' => 'gal', 'gallons' => 'gal',
			'm²' => 'm2', 'ft²' => 'ft2', 'sq ft' => 'ft2', 'acres' => 'ac', 'acre' => 'ac',
		);
		if ( '' !== self::category_of( $unit ) ) {
			return $unit;
		}
		$lower = strtolower( $unit );
		if ( isset( $aliases[ $unit ] ) ) {
			return $aliases[ $unit ];
		}
		if ( isset( $aliases[ $lower ] ) ) {
			return $aliases[ $lower ];
		}
		foreach ( self::table() as $units ) {
			foreach ( array_keys( $units ) as $key ) {
				if ( strtolower( $key ) === $lower ) {
					return $key;
				}
			}
		}
		return '';
	}

	/**
	 * Converts a value. Returns null when the units are unknown or incompatible.
	 *
	 * @param float  $value Value.
	 * @param string $from  Source unit key.
	 * @param string $to    Target unit key.
	 * @return float|null
	 */
	public static function convert( $value, $from, $to ) {
		$cat = self::category_of( $from );
		if ( '' === $cat || self::category_of( $to ) !== $cat || ! is_numeric( $value ) ) {
			return null;
		}
		$value = (float) $value;
		return self::from_base( $cat, $to, self::to_base( $cat, $from, $value ) );
	}

	/**
	 * Converts to the category's base unit.
	 *
	 * @param string $cat  Category.
	 * @param string $unit Unit key.
	 * @param float  $v    Value.
	 * @return float
	 */
	private static function to_base( $cat, $unit, $v ) {
		if ( 'temperature' === $cat ) {
			if ( 'F' === $unit ) {
				return ( $v - 32 ) * 5 / 9;
			}
			return 'K' === $unit ? $v - 273.15 : $v;
		}
		if ( 'fuel' === $cat ) {
			return self::fuel( $unit, $v );
		}
		$table = self::table();
		return $v * $table[ $cat ][ $unit ];
	}

	/**
	 * Converts from the category's base unit.
	 *
	 * @param string $cat  Category.
	 * @param string $unit Unit key.
	 * @param float  $v    Value.
	 * @return float
	 */
	private static function from_base( $cat, $unit, $v ) {
		if ( 'temperature' === $cat ) {
			if ( 'F' === $unit ) {
				return $v * 9 / 5 + 32;
			}
			return 'K' === $unit ? $v + 273.15 : $v;
		}
		if ( 'fuel' === $cat ) {
			return self::fuel( $unit, $v );
		}
		$table = self::table();
		return $v / $table[ $cat ][ $unit ];
	}

	/**
	 * Fuel economy units are reciprocal to L/100 km, so the same formula goes both ways.
	 *
	 * @param string $unit Unit key.
	 * @param float  $v    Value.
	 * @return float
	 */
	private static function fuel( $unit, $v ) {
		$k = array( 'kml' => 100, 'mpg' => 235.214583, 'mpgUK' => 282.480936 );
		if ( ! isset( $k[ $unit ] ) ) {
			return $v;
		}
		return 0.0 === (float) $v ? INF : $k[ $unit ] / $v;
	}

	/**
	 * Rounds for display, dropping float noise and trailing zeros.
	 *
	 * @param float $n        Number.
	 * @param int   $decimals Max decimals.
	 * @return string
	 */
	public static function format( $n, $decimals = 2 ) {
		if ( is_infinite( $n ) ) {
			return '∞';
		}
		if ( is_nan( $n ) ) {
			return '—';
		}
		$decimals = max( 0, min( 6, (int) $decimals ) );
		$abs      = abs( $n );
		// Keep small values readable instead of rounding them to 0.
		while ( $abs > 0 && $abs < pow( 10, -$decimals ) && $decimals < 6 ) {
			++$decimals;
		}
		$s = number_format_i18n( $n, $decimals );
		$dp = isset( $GLOBALS['wp_locale'] ) ? $GLOBALS['wp_locale']->number_format['decimal_point'] : '.';
		if ( false !== strpos( $s, $dp ) ) {
			$s = rtrim( rtrim( $s, '0' ), $dp );
		}
		return $s;
	}
}
