export class BasicCharatterController {
  private _input: BasicCharatterControllerInput; 
  private _stateMachine: FiniteStateMachine;

  constructor()
  {
    this._input = new BasicCharatterControllerInput();
    this._stateMachine = new FiniteStateMachine(new BasicCharatterControllerProxy(this);
  }
}

export class BasicCharatterControllerInput {
  private _keys: { forward: boolean; backward: boolean; left: boolean; right: boolean; space: boolean; shift: boolean; };
  constructor()
  {
    this.init()
  }

  public init(){
    this._keys = { 
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    }
    document.addEventListener('keydown' , (e)=> this._onKeyDown(e), false);
    document.addEventListener('keyup' , (e)=> this._onKeyUp(e), false);
  }

  private _onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
        this._keys.forward = true;
      break;
      case 'KeyS':
        this._keys.backward = true;
      break;
      case 'KeyA':
        this._keys.left = true;
      break;
      case 'KeyD':
        this._keys.right = true;
      break;
      case 'Shift':
        this._keys.shift = true
      break;
      case 'Space':
        this._keys.space = true
      break;
    }
  }

  private _onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
        this._keys.forward = false;
      break;
      case 'KeyS':
        this._keys.backward = false;
      break;
      case 'KeyA':
        this._keys.left = false;
      break;
      case 'KeyD':
        this._keys.right = false;
      break;
      case 'Shift':
        this._keys.shift = false
      break;
      case 'Space':
        this._keys.space = false
      break;
    }
  }
}


export class FiniteStateMachine {
  private _states: {};  
  private _currentState: null;
  constructor()
  {
    this._states = {};
    this._currentState = null;
  }

  _addState(name:string, type:CharacterState){
    this._states[name] = type
  }
  setState(name) {

    const prevState = this._currentState;

    if(prevState){
      if(prevState.name == name){
        return;
      }
    prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);

  }

  Update(timeElapsed,input){
    if(this._currentState){ 
      this._currentState.Update(timeElapsed,input);
    }
  }
}

class CharaterStateMachine extends FiniteStateMachine {
  constructor(proxy){
  super();
  this._proxy = proxy;
  this._init();
  }

  _init(){
    this._addState('Death');   
    this._addState('Duck');   
    this._addState('HitReact');   
    this._addState('Idle');   
    this._addState('Jump');   
    this._addState('Jump_Idle'); 
    this._addState('Jump_Land');   
    this._addState('No');   
    this._addState('Punch');   
    this._addState('Run');   
    this._addState('Sword');   
    this._addState('Walk'); 
    this._addState('Wave');   
    this._addState( 'Yes');
  }
  }


export class BasicCharatterControllerProxy {
  constructor(param){}
}


export class CharacterState {
constructor(parent:FiniteStateMachine){
}
}

export class IdleState extends CharacterState {


}


