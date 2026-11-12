=== Unit Flip – Metric & Imperial Converter ===
Contributors: catalonec
Tags: unit converter, metric, imperial, recipe, conversion
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Show every measurement in both metric and imperial, and add an interactive unit converter to any post. Made for recipe, DIY, travel and fitness sites.

== Description ==

Half of your readers think in grams and Celsius, the other half in cups and Fahrenheit. Unit Flip shows both.

**Inline conversions with a shortcode**

`[unitflip value="350" from="F"]` shows **350 °F (177 °C)**.

`[unitflip value="2" from="cups" to="ml"]` shows **2 cups (473.2 ml)**.

If you leave out `to`, Unit Flip picks the usual metric or imperial counterpart (°F → °C, lb → kg, mi → km, cups → ml, and so on).

**Interactive converter block**

Add the "Unit Converter" block (or the `[unitflip_converter category="temperature"]` shortcode) and visitors can convert any value themselves. It works on phones, has a swap button and is keyboard and screen-reader friendly.

**Categories**

Length, weight, temperature, volume (including cups, tablespoons, teaspoons, fluid ounces, pints, quarts, US and UK gallons), area, speed, pressure, energy (calories and kilojoules), power, fuel economy (L/100 km, km/L, mpg) and data size.

**Settings**

Choose the number of decimals and the display style: `350 °F (177 °C)`, `350 °F / 177 °C`, or only the converted value with the original on hover.

**Lightweight and private**

No external requests, no tracking, no cookies, no database tables. The script loads only on pages that contain a converter.

**Unit Flip Pro add-on**

A separate, optional add-on is available that converts measurements already written in your posts automatically (no shortcodes needed), adds a metric/imperial switch for visitors, and converts cups of common baking ingredients to grams. Everything described above stays free in this plugin.

**For developers**

Filters: `unit_flip_units` (add categories or units), `unit_flip_symbols`, `unit_flip_counterparts`, `unit_flip_category_labels`.

== Installation ==

1. Install the plugin from Plugins → Add New, or upload the `unit-flip` folder to `/wp-content/plugins/`.
2. Activate it.
3. Use the `[unitflip]` shortcode in your text or add the "Unit Converter" block. Options are in Settings → Unit Flip.

== Frequently Asked Questions ==

= Which unit names can I use? =

Short keys like `F`, `C`, `kg`, `lb`, `oz`, `cup`, `tbsp`, `tsp`, `ml`, `l`, `mi`, `km`, `ft`, `m`, `in`, `cm`, `mph`, `kmh`, `psi`, `bar`, `kcal`, `kJ`, `mpg`, `l100`, plus common spellings such as `fahrenheit`, `pounds`, `cups` or `km/h`.

= What happens with a typo in the shortcode? =

The original text is shown unchanged, so your post still reads correctly.

= Can I use a comma as the decimal separator? =

Yes. `value="1,5"` works, and results follow your site's number format.

= Does it convert cups of flour to grams? =

Cups to grams depends on the ingredient, so this plugin converts volume to volume (cups to ml). Ingredient-aware conversion is part of the Pro add-on.

== Screenshots ==

1. Inline conversions in a recipe.
2. The interactive converter block.
3. Settings page.

== Changelog ==

= 1.0.0 =
* First release.
