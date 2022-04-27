
class LoaderIndicator {
	constructor( inputDomElement ) {
		this.rootElem = inputDomElement;
		this.loaderWidth = '150px';
		this.loaderHeight = '150px';
		this.text = document.createElement( 'a' )

		this.init();
	}

	init() {
		this.text.textContent = 'Loading...'
		this.createHolder();
		this.createLoader();
	}
	updateText(text = '...'){
		this.text.textContent = 'Loading ' + text
	}

	addElementToHolder( element ) {
		this.holder.appendChild( element );
	}

	resize() {
		if ( this.rootElem ) {
			this.holder.style.width = `${ this.rootElem.clientWidth }px`;
			this.holder.style.height = `${ this.rootElem.clientHeight }px`;
		} else {
			this.holder.style.width = `${ window.innerWidth }px`;
			this.holder.style.height = `${ window.innerHeight }px`;
		}
	}

	createHolder() {
		this.holder = document.createElement( 'div' );
		this.holder.className = 'holder';

		this.resize();

		this.holder.style.display = 'flex';
		this.holder.style.justifyContent = 'center';
		this.holder.style.alignItems = 'center';
		this.holder.style.backgroundColor = '#797C7E';

		if ( this.rootElem ) {
			this.rootElem.appendChild( this.holder );
		}else {
			document.body.appendChild( this.holder );
		}
	}

	createLoader() {
		this.ldr = document.createElement( 'div' );
		this.ldr.className = 'containerLoader';	
		this.ldr.style.display = 'flex'
		this.ldr.style.justifyContent = 'center';
		this.ldr.style.alignItems = 'center';
		

		this.loaderElem = document.createElement( 'div' );
		this.loaderElem.className = 'loader';
		this.loaderElem.style.width = this.loaderWidth;
		this.loaderElem.style.height = this.loaderHeight;
		this.loaderElem.style.display = 'block';

		this.loaderElem.style.borderWidth = '32px';
		this.loaderElem.style.borderColor = '#f3f3f3';
		this.loaderElem.style.borderStyle = 'solid';
		this.loaderElem.style.borderRadius = '50%';
		this.loaderElem.style.borderTopWidth = '32px';
		this.loaderElem.style.borderTopStyle = 'solid';
		this.loaderElem.style.borderTopColor = '#3498db';


		this.loaderElem.style.animationName = 'spin';
		this.loaderElem.style.animationDuration = '2s';
		this.loaderElem.style.animationTimingFunction = 'cubic-bezier(0.215, 0.610, 0.355, 1)';
		this.loaderElem.style.animationIterationCount = 'infinite';

		const style = document.createElement( 'style' );

		const keyFrames = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
		style.innerHTML = keyFrames;
		this.loaderElem.appendChild( style );

		this.statusElem = document.createElement( 'div' );
		this.statusElem.className = 'status'
		this.statusElem.style.display = 'flex'
		this.statusElem.style.justifyContent = 'center';
		this.statusElem.style.alignItems = 'center';
		this.statusElem.style.position = 'absolute'

		this.statusElem.appendChild(this.text)
		this.ldr.style.justifyContent = 'center';
		this.ldr.style.alignItems = 'center';

		this.ldr.appendChild( this.statusElem);
		this.ldr.appendChild( this.loaderElem );
		this.holder.appendChild( this.ldr );
	}
}

export { LoaderIndicator };
