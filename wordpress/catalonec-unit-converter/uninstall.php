<?php
/**
 * Removes plugin data on uninstall.
 *
 * @package Unit_Flip
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'unit_flip_settings' );
