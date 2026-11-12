<?php
/**
 * Plugin Name:       Unit Flip – Metric & Imperial Converter
 * Plugin URI:        https://catalonec1.github.io/pwa-utils/unit-flip/
 * Description:       Show measurements in both metric and imperial with a shortcode, and add an interactive unit converter block for recipes, DIY guides and travel posts.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            catalonec
 * Author URI:        https://catalonec1.github.io/pwa-utils/
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       unit-flip
 *
 * @package Unit_Flip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UNIT_FLIP_VERSION', '1.0.0' );
define( 'UNIT_FLIP_FILE', __FILE__ );
define( 'UNIT_FLIP_DIR', plugin_dir_path( __FILE__ ) );
define( 'UNIT_FLIP_URL', plugin_dir_url( __FILE__ ) );
define( 'UNIT_FLIP_PRO_URL', 'https://catalonec1.github.io/pwa-utils/unit-flip/' );

require_once UNIT_FLIP_DIR . 'includes/class-unit-flip-units.php';
require_once UNIT_FLIP_DIR . 'includes/class-unit-flip.php';

if ( is_admin() ) {
	require_once UNIT_FLIP_DIR . 'includes/class-unit-flip-admin.php';
	Unit_Flip_Admin::init();
}

Unit_Flip::init();
