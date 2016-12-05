export const configTypes = {
	FIELD: 'FIELD',
	STRUCTURE: 'STRUCTURE',
	LIST: 'LIST'
}

export class Form {
	static getConfigProperties(config) {
		const configPropertiesMap = {
			...config,
			...(config._dynamic || {}),
		}
		delete configPropertiesMap._dynamic

		return Object.keys(configPropertiesMap)
	}

	__cache = {}

	constructor({config, state, dynamicData, onChange}) {
		if (typeof dynamicData === 'function') {
			dynamicData = dynamicData(state)
		}
		const configProperties = Form.getConfigProperties(config)

		configProperties.forEach((prop) => {
			const getter = function () {
				if (getter.inFunction) {
					throw new Error('[TODO form] Circular reference in dynamic config, prop: ' + prop)
				}

				if (this.__cache.hasOwnProperty(prop)) {
					return this.__cache[prop]
				}

				getter.inFunction = true

				const result = config._dynamic && typeof config._dynamic === 'object' && typeof config._dynamic[prop] === 'function'
					? config._dynamic[prop].call(this, dynamicData)
					: config[prop]

				this.__cache[prop] = result

				getter.inFunction = false

				return result
			}

			getter.inFunction = false

			Object.defineProperty(this, prop, {
				configurable: true,
				enumerable: true,
				writeable: true,
				get: getter
			})
		})

		// Default values
		if (!this.getValue) {
			Object.defineProperty(this, 'getValue', {
				configurable: true,
				enumerable: true,
				writeable: true,
				value: (state) => state
			})
		}

		if (!this.setValue) {
			Object.defineProperty(this, 'setValue', {
				configurable: true,
				enumerable: true,
				writeable: true,
				value: (state, newValue) => newValue
			})
		}

		Object.defineProperty(this, 'value', {
			configurable: true,
			enumerable: true,
			writeable: true,
			value: this.getValue(state)
		})

		Object.defineProperty(this, 'handleChange', {
			configurable: true,
			enumerable: true,
			writeable: true,
			value: (newState) => onChange(this.setValue(state, newState))
		})

		// Check boundaries
		if (!this.type) {
			throw new Error('[TODO form] You must specify type of the config')
		}

		if (!configTypes.hasOwnProperty(this.type)) {
			throw new Error(`[TODO form] Unknown config type. You provided ${this.type}. Possible values: ${Object.keys(configTypes).join(', ')}.`)
		}


		// TODO: items[string] (ENUM + itemsCOnfig)
		if (Array.isArray(this.items)) {
			const Constructor = this.constructor // extendable

			Object.defineProperty(this, 'items', {
				configurable: true,
				enumerable: true,
				writeable: true,
				value:  this.items
					.filter(Boolean)
					.map((itemConfig) => new Constructor({
						config: itemConfig,
						state,
						dynamicData: {
							...dynamicData,
							parent: this
						},
						onChange: this.handleChange
					}))
			})
		}
	}
}
