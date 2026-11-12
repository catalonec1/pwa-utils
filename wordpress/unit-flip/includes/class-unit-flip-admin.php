<?php
/**
 * Settings page.
 *
 * @package Unit_Flip
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin screens.
 */
class Unit_Flip_Admin {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( UNIT_FLIP_FILE ), array( __CLASS__, 'action_links' ) );
	}

	/**
	 * Adds Settings > Unit Flip.
	 */
	public static function menu() {
		add_options_page( __( 'Unit Flip', 'unit-flip' ), __( 'Unit Flip', 'unit-flip' ), 'manage_options', 'unit-flip', array( __CLASS__, 'page' ) );
	}

	/**
	 * Adds a Settings link on the Plugins screen.
	 *
	 * @param array $links Links.
	 * @return array
	 */
	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=unit-flip' ) ) . '">' . esc_html__( 'Settings', 'unit-flip' ) . '</a>' );
		return $links;
	}

	/**
	 * Registers the option.
	 */
	public static function register_settings() {
		register_setting(
			'unit_flip',
			Unit_Flip::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
				'default'           => array(
					'decimals' => 1,
					'style'    => 'parentheses',
				),
			)
		);
	}

	/**
	 * Sanitizes the option.
	 *
	 * @param mixed $input Raw input.
	 * @return array
	 */
	public static function sanitize( $input ) {
		$input = is_array( $input ) ? $input : array();
		$style = isset( $input['style'] ) ? sanitize_key( $input['style'] ) : 'parentheses';
		return array(
			'decimals' => isset( $input['decimals'] ) ? max( 0, min( 6, absint( $input['decimals'] ) ) ) : 1,
			'style'    => in_array( $style, array( 'parentheses', 'slash', 'result' ), true ) ? $style : 'parentheses',
		);
	}

	/**
	 * Renders the settings page.
	 */
	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s      = Unit_Flip::settings();
		$styles = array(
			'parentheses' => '350 °F (177 °C)',
			'slash'       => '350 °F / 177 °C',
			'result'      => __( '177 °C (original shown on hover)', 'unit-flip' ),
		);
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Unit Flip', 'unit-flip' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'unit_flip' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="unit-flip-decimals"><?php esc_html_e( 'Decimals', 'unit-flip' ); ?></label></th>
						<td><input type="number" min="0" max="6" id="unit-flip-decimals" name="<?php echo esc_attr( Unit_Flip::OPTION ); ?>[decimals]" value="<?php echo esc_attr( $s['decimals'] ); ?>" class="small-text"></td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Display style', 'unit-flip' ); ?></th>
						<td>
							<?php foreach ( $styles as $key => $label ) : ?>
								<label><input type="radio" name="<?php echo esc_attr( Unit_Flip::OPTION ); ?>[style]" value="<?php echo esc_attr( $key ); ?>" <?php checked( $s['style'], $key ); ?>> <?php echo esc_html( $label ); ?></label><br>
							<?php endforeach; ?>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<h2><?php esc_html_e( 'How to use', 'unit-flip' ); ?></h2>
			<p><code>[unitflip value="350" from="F"]</code> → <?php echo wp_kses_post( (string) Unit_Flip::render_value( 350, 'F', 'C', $s['decimals'], $s['style'] ) ); ?></p>
			<p><code>[unitflip value="2" from="cups" to="ml"]</code> → <?php echo wp_kses_post( (string) Unit_Flip::render_value( 2, 'cup', 'ml', $s['decimals'], $s['style'] ) ); ?></p>
			<p><code>[unitflip_converter category="temperature"]</code> — <?php esc_html_e( 'interactive converter. Also available as the "Unit Converter" block.', 'unit-flip' ); ?></p>
			<p><?php esc_html_e( 'Categories:', 'unit-flip' ); ?> <code><?php echo esc_html( implode( ', ', array_keys( Unit_Flip::category_labels() ) ) ); ?></code></p>

			<?php if ( ! defined( 'UNIT_FLIP_PRO_VERSION' ) ) : ?>
			<div class="card">
				<h2><?php esc_html_e( 'Unit Flip Pro add-on', 'unit-flip' ); ?></h2>
				<p><?php esc_html_e( 'A separate add-on that converts measurements already written in your posts automatically (no shortcodes), adds a metric/imperial switch for visitors, and converts cups of common baking ingredients to grams.', 'unit-flip' ); ?></p>
				<p><a href="<?php echo esc_url( UNIT_FLIP_PRO_URL ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn more', 'unit-flip' ); ?></a></p>
			</div>
			<?php endif; ?>
		</div>
		<?php
	}
}
