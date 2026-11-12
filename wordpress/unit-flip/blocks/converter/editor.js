/* Editor UI for the Unit Converter block (no build step needed). */
(function (blocks, element, blockEditor, components, i18n) {
	'use strict';
	var h = element.createElement;
	var __ = i18n.__;
	var cats = window.unitFlipCategories || { length: 'Length' };
	var options = Object.keys(cats).map(function (k) { return { value: k, label: cats[k] }; });

	blocks.registerBlockType('unit-flip/converter', {
		edit: function (props) {
			var cat = props.attributes.category;
			var picker = h(components.SelectControl, {
				label: __('Converter type', 'unit-flip'),
				value: cat,
				options: options,
				onChange: function (v) { props.setAttributes({ category: v }); }
			});
			return h('div', blockEditor.useBlockProps(),
				h(blockEditor.InspectorControls, null, h(components.PanelBody, { title: __('Settings', 'unit-flip') }, picker)),
				h(components.Placeholder, {
					icon: 'image-flip-horizontal',
					label: __('Unit Converter', 'unit-flip') + ': ' + (cats[cat] || cat),
					instructions: __('Visitors will see an interactive converter here.', 'unit-flip')
				}, picker)
			);
		},
		save: function () { return null; }
	});
})(window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n);
