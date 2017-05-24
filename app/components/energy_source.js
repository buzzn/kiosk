import React from 'react';
import PropTypes from 'prop-types';

const EnergySource = ({ type, value }) => {
  const icons = {
    type: '',
    arrow: 'fa-square',
    color: '#ffffff',
  };

  switch(type) {
    case 'solar':
      icons.type = 'fa-sun-o';
      icons.arrow = 'fa-4x fa-chevron-right';
      icons.color = '#ffeb3b';
      break;
    case 'fire':
      icons.type = 'fa-fire';
      icons.arrow = 'fa-4x fa-chevron-right';
      icons.color = '#ffa726';
      break;
    case 'grid':
      icons.type = 'fa-users';
      icons.arrow = 'fa-4x fa-chevron-left';
      icons.color = '#bdbdbd';
      break;
  }

  return (
    <div style={{ width: '460px', height: '120px', position: 'relative', backgroundImage: `linear-gradient(to right, #ffffff, ${icons.color})`, marginBottom: '20px' }}>
      <i className={ `fa fa-5x ${icons.type}` } style={{ float: 'left', marginTop: '19px', marginLeft: '32px', color: '#9e9e9e' }} />
      <div className="power" style={{ float: 'left', marginTop: '40px', marginLeft: '60px', fontSize: '34px' }}>{ value } W</div>
      <div style={{ position: 'absolute', background: 'white', borderRadius: '60px', right: '-60px', top: '0', width: '120px', height: '120px' }}>
        <i className={ `fa ${value === 0 ? 'fa-square' : icons.arrow}` } style={{ marginTop: value === 0 ? '50px' : '30px', marginLeft: value === 0 ? '54px' : '40px' }} />
      </div>
    </div>
  );
};

EnergySource.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

EnergySource.defaultProps = {
  value: 0,
};

export default EnergySource;
