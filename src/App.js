import React, { Component, PropTypes } from 'react';
import {Form} from './form'
import logo from './logo.svg';
import './App.css';

class App extends Component {
	state = {
		isRequired: false,
	}

	render() {
		return (
			<div className="App">
				<div className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h2>Welcome to React</h2>
				</div>
				<p className="App-intro">
					To get started, edit <code>src/App.js</code> and save to reload.
				</p>
				<section id='form'>
					<div>
						<input
							type='checkbox'
							id='isrequired'
							checked={this.state.isRequired}
							onChange={(ev) => this.setState({isRequired: ev.target.checked})}
						/>
						{' '}
						<label htmlFor='isrequired'>Is required?</label>
					</div>
					<FormComponent
						isRequired={this.state.isRequired}
					/>
				</section>
			</div>
		);
	}
}

export default App;

const fields = {
	name: {
		type: 'FIELD',
		id: 'name',
		name: 'Name',
		getValue: (state) => state.name,
		setValue: (state, newValue) => ({...state, name: newValue}),
		_dynamic: {
			isRequired: ({parent}) => parent.isRequired,
		},
	},
	age: {
		type: 'FIELD',
		id: 'age',
		name: 'Age',
		getValue: (state) => state.age,
		setValue: (state, newValue) => ({...state, age: newValue}),
		limits: {
			min: 13,
			max: 150,
		},
		_dynamic: {
			isRequired: ({parent}) => parent.isRequired,
			validate () {
				return (value) => {
					if (value < this.limits.min || value > this.limits.max) {
						return `Value must be between ${this.limits.min} and ${this.limits.max}`;
					}
				}
			}
		},
	},
	parentName: {
		type: 'FIELD',
		id: 'parentName',
		name: 'Parent name',
		getValue: (state) => state.parent.name,
		setValue: (state, newValue) => ({
			...state,
			parent: {
				...state.parent,
				name: newValue,
			},
		}),
		isRequired: true,
	},
}

/*const participants = {
	type: 'LIST',
	name: 'Participants',
	indexName: 'index',
	_dynamic: {
		itemsCount() {return this.value.length},
	},
}*/

const getFormConfig = (props) => ({
	type: 'STRUCTURE',
	isRequired: props.isRequired,
	_dynamic: {
		items: ({age}) => [
			fields.name,
			fields.age,
			age !== null && age < 18 && fields.parentName,
		],
	},
})

class FormComponent extends Component {
	static propTypes = {
		isRequired: PropTypes.bool.isRequired,
	}

	state = {
		formData: {
			name: '',
			age: null,
			parent: {
				name: '',
			},
		}
	}

	render() {
		const form = new Form({
			config: getFormConfig(this.props),
			state: this.state.formData,
			dynamicData: (state) => ({
				age: state.age,
			}),
			onChange: (newState) => this.setState({formData: newState})
		})

		return (
			<form>
				{form.items.map((field) =>
					<div key={field.id}>
						<label htmlFor={field.id}>
							{field.name}
							{field.isRequired && <small> (required)</small>}
						</label>
						<input
							type={field.limits ? 'number' : 'text'}
							id={field.id}
							value={field.value || ''}
							onChange={(ev) => field.handleChange(ev.target.value)}
							min={field.limits && field.limits.min}
							max={field.limits && field.limits.max}
						/>
					</div>
				)}
			</form>
		)
	}
}

