<?php
/**
 * Plugin Name:       Unit Flip Pro
 * Plugin URI:        https://catalonec1.github.io/pwa-utils/unit-flip/
 * Description:       Add-on for Unit Flip: converts measurements already written in your posts automatically, adds a metric/imperial switch for visitors and converts cups of baking ingredients to grams.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Requires Plugins:  unit-flip
 * Author:            catalonec
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       unit-flip-pro
 *
 * @package Unit_Flip_Pro
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UNIT_FLIP_PRO_VERSION', '1.0.0' );
define( 'UNIT_FLIP_PRO_URL_BASE', plugin_dir_url( __FILE__ ) );

add_action(
	'plugins_loaded',
	function () {
		if ( ! class_exists( 'Unit_Flip' ) ) {
			add_action(
				'admin_notices',
				function () {
					echo '<div class="notice notice-error"><p>' . esc_html__( 'Unit Flip Pro needs the free Unit Flip plugin. Install it from Plugins → Add New.', 'unit-flip-pro' ) . '</p></div>';
				}
			);
			return;
		}
		require_once __DIR__ . '/includes/class-unit-flip-pro.php';
		Unit_Flip_Pro::init();
	}
);
