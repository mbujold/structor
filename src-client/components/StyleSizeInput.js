/*
 * Copyright 2017 Alexander Pustovalov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isObject, isString, get, set, debounce, startCase } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

const unitList = ['px', 'em', '%', 'ex', 'ch', 'rem', 'vw', 'vh', 'cm', 'mm', 'in', 'pt', 'pc'];

const getUnitsOfProperty = (propertyValue) => {
  if (propertyValue) {
    let checkString;
    if (isString(propertyValue)) {
      checkString = propertyValue;
    } else {
      checkString = '' + propertyValue;
    }
    checkString = checkString.toLowerCase();
    let found = unitList.find(u => checkString.indexOf(u) > 0);
    if (found) {
      return found;
    } else {
      return 'px';
    }
  }
  return 'px';
};

const getValueOfProperty = (propertyValue) => {
  if (propertyValue) {
    let checkValue = parseFloat(propertyValue);
    if (isFinite(checkValue)) {
      return checkValue;
    }
  }
  return 0;
};

const getStateObject = (valueObject, path) => {
  let value;
  if (valueObject && isObject(valueObject)) {
    value = get(valueObject, path);
  }
  let label = path.split('.');
  if (label && label.length > 1) {
    label = startCase(label[1]);
  } else {
    label = path.replace('.', ' / ');
  }
  return {
    valueObject: valueObject,
    label: label,
    value: getValueOfProperty(value),
    units: getUnitsOfProperty(value),
  };
};

const rowContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  position: 'relative',
  width: '100%',
  marginTop: '3px',
};

const inputStyle = {
  height: '1.55em', paddingTop: '2px', paddingBottom: '2px'
};

const buttonStyle = {
  width: '2em',
};

const doubleButtonStyle = {
  width: '4em',
};

const checkBoxStyle = {margin: 0};
const labelStyle = {margin: '0px 0px 0px 3px'};

class StyleSizeInput extends Component {

  constructor (props) {

    super(props);

    this.state = getStateObject(props.valueObject, props.path);

    this.handleChangeInputValue = this.handleChangeInputValue.bind(this);
    this.handleToggleOption = this.handleToggleOption.bind(this);
    this.handleToggleFavorite = this.handleToggleFavorite.bind(this);
    this.handleChangeUnits = this.handleChangeUnits.bind(this);
    this.changeValueByMouse = this.changeValueByMouse.bind(this);
    this.changeValue = this.changeValue.bind(this);
  }

  componentWillReceiveProps (nextProps) {
    const {valueObject, path} = nextProps;
    this.setState(getStateObject(valueObject, path));
  }

  componentDidMount () {
    this.delayedChangeInputValue = debounce(valueObject => {
      if (this.props.onChangeValue) {
        this.props.onChangeValue(valueObject);
      }
    }, 1000);
  }

  componentWillUnmount () {
    this.delayedChangeInputValue.cancel;
  }

  handleChangeInputValue (e) {
    const value = e.currentTarget.value;
    this.setState({value});
    this.changeValue(value, this.state.units, true);
  }

  handleToggleOption (e) {
    const {path, onSet} = this.props;
    const checked = e.currentTarget.checked;
    onSet(path, checked);
  }

  handleToggleFavorite (e) {
    e.stopPropagation();
    e.preventDefault();
    const {path, onToggleFavorite} = this.props;
    onToggleFavorite(path);
  }

  handleChangeUnits (e) {
    const newUnits = e.currentTarget.dataset.units;
    this.setState({
      units: newUnits,
    });
    this.changeValue(this.state.value, newUnits);
  }

  handleMouseDown = (direction) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({isMouseDown: true});
    this.changeValueByMouse(direction);
  };

  handleMouseUp = (e) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({isMouseDown: false});
  };

  changeValueByMouse (direction) {
    setTimeout(() => {
      const {value, units} = this.state;
      let newValue = direction === 'up' ? (value + 1) : (value - 1);
      this.setState({value: newValue});
      this.changeValue(newValue, units);
      if (this.state.isMouseDown) {
        this.changeValueByMouse(direction);
      }
    }, 200);
  };

  changeValue (newValue, newUnits, delay = false) {
    const value = getValueOfProperty(newValue);
    let valueObject = set({}, this.props.path, '' + value + newUnits);
    if (delay) {
      this.delayedChangeInputValue(valueObject);
    } else {
      this.props.onChangeValue(valueObject);
    }
  }

  render () {
    const {isSet, isFavorite} = this.props;
    const {label, units, value} = this.state;
    return (
      <div style={this.props.style}>
        <div style={rowContainerStyle}>
          <input
            type="checkbox"
            style={checkBoxStyle}
            checked={isSet}
            onChange={this.handleToggleOption}/>
          <div style={{flexGrow: 1}}>
            <p style={labelStyle}>
              {isSet ? <strong>{label}</strong> : <span className="text-muted">{label}</span>}
            </p>
          </div>
          <div style={{flexGrow: 0}}>
            <i
              className={'fa text-muted ' + (isFavorite ? 'fa-heart' : 'fa-heart-o')}
              style={{cursor: 'pointer'}}
              title={isFavorite ? 'Remove from the favorites list' : 'Add to the favorites list'}
              onClick={this.handleToggleFavorite}
            />
          </div>
        </div>
        {isSet &&
        <div style={rowContainerStyle}>
          <div style={{flexGrow: 2}}>
            <div style={doubleButtonStyle}>
              <div className="btn-group">
                <button
                  className="btn btn-default btn-xs"
                  style={buttonStyle}
                  onMouseDown={this.handleMouseDown('up')}
                  onMouseUp={this.handleMouseUp}
                  type="button">
                  <i className="fa fa-plus"/>
                </button>
                <button
                  className="btn btn-default btn-xs"
                  style={buttonStyle}
                  onMouseDown={this.handleMouseDown('down')}
                  onMouseUp={this.handleMouseUp}
                  type="button">
                  <i className="fa fa-minus"/>
                </button>
              </div>
            </div>
          </div>
          <div style={{flexGrow: 1}}>
            <div>
              <div className="input-group">
                <input
                  type="text"
                  style={inputStyle}
                  className="form-control"
                  value={value}
                  onChange={this.handleChangeInputValue}/>
                <div
                  key="unitsButton"
                  className="input-group-btn"
                  role="group">
                  <button
                    className="btn btn-default btn-xs dropdown-toggle"
                    data-toggle="dropdown">
                    <span>{units}</span>
                  </button>
                  <ul
                    className="dropdown-menu dropdown-menu-right"
                    role="menu">
                    {unitList.map((u, index) => {
                      return (
                        <li key={u + index}>
                          <a
                            href="#"
                            data-units={u}
                            onClick={this.handleChangeUnits}>
                            {u}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        }
      </div>
    );
  }
}

StyleSizeInput.propTypes = {
  valueObject: PropTypes.any.isRequired,
  path: PropTypes.string.isRequired,
  isSet: PropTypes.bool.isRequired,
  onSet: PropTypes.func.isRequired,
  onChangeValue: PropTypes.func.isRequired,
};

StyleSizeInput.defaultProps = {
  valueObject: null,
  path: 'style.width',
  isSet: false,
  onSet: (path, checked) => {
    console.log(path, checked);
  },
  onChangeValue: (valueObject) => {
    console.log(JSON.stringify(valueObject));
  },
};

export default StyleSizeInput;