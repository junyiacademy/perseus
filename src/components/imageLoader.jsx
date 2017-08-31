import React from 'react';
import InfoTip from 'react-components/js/info-tip.jsx';

class UrlInput extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { value: this.props.value };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.value });
  }

  handleChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    return (
      <input
        className={this.props.className}
        style={this.props.style}
        type="text"
        value={this.state.value}
        onChange={this.handleChange}
        disabled={this.state.value}
      />
    );
  }
}

UrlInput.propTypes = {
  className: React.PropTypes.string,
  style: React.PropTypes.any,
  value: React.PropTypes.string.isRequired,
  onChange: React.PropTypes.func.isRequired,
};

class ImageLoader extends React.Component {
  constructor(props) {
    super(props);

    this.onUrlChange = this.onUrlChange.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
    this.clearUrl = this.clearUrl.bind(this);

    const url = this.props.originImage && this.props.originImage.url;
    if (url) this.onUrlChange(url);

    const reader = new FileReader();
    const self = this;
    reader.onloadend = function () {
      self.onUrlChange(self.state.reader.result);
    };
    this.state = { reader, url: '' };
  }

  reloadImage(url) {
    const img = new Image();
    img.onload = function () {
      this.props.setUrl(url, img.width, img.height);
    }.bind(this);
    img.src = url;
  }

  onUrlChange(url) {
    if (url) {
      if (this.props.editorMode) this.props.setUrl(url);
      else if (this.props.originImage.url != url) this.reloadImage(url);
    }
    else if (!this.props.editorMode) this.props.setUrl(url, 0, 0);

    this.setState({ url });
  }

  onFileChange(e) {
    const file = e.target.files[0];
    this.state.reader.readAsDataURL(file);
  }

  clearUrl(e) {
    e.preventDefault();
    if (this.props.clearUrl) {
      const url = this.state.url;
      this.props.clearUrl(url);
    }
    else this.onUrlChange('');

    this.setState({ url: '' });
  }

  render() {
    return <div>圖片網址:{' '}
      <UrlInput
        className={this.props.className || ''}
        value={this.props.originImage && this.props.originImage.url || this.state.url || ''}
        onChange={this.onUrlChange}
      />
      <input
        type="file"
        onChange={this.onFileChange}
      />
      <button onClick={this.clearUrl} disabled={!this.state.url}>X</button>
      <InfoTip>
        <p>填入圖片的網址。例如，先上傳至 http://imgur.com ，貼上圖片網址 (Direct link)。</p>
      </InfoTip>
    </div>;
  }
}

export default ImageLoader;