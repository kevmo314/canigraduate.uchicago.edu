import {Inject, ModuleWithProviders, NgModule, OnDestroy, Type} from '@angular/core';
import {Compiler, InjectionToken, Injector, NgModuleFactory, NgModuleFactoryLoader, NgModuleRef} from '@angular/core';

import {ReduxDevtoolsExtension, ReduxDevtoolsOptions} from './redux_devtools_extension';
import {RootState} from './root_state';
import {Store} from './store';
import {StoreConfig} from './store_config';
import {REDUX_DEVTOOLS_EXTENSION, STORE_CONFIG} from './tokens';

// States are just objects. This is here for syntactic sugar.
export type State = Object;

export interface Action {
  type?: string;
  reduce(state: State): State;
}

export interface Reducer<S extends State, A extends Action> {
  (state: S, action: A): S;
}

export interface SpecificationNode {
  module: Type<any>;
  reducer: Reducer<State, Action>;
  state: State;
  children: SpecificationNode[];
}

@NgModule({providers: [RootState, ReduxDevtoolsExtension]})
export class StoreModule implements OnDestroy {
  static forRoot(args: StoreConfig): ModuleWithProviders {
    return {
      ngModule: StoreModule,
      providers: [
        {
          provide: STORE_CONFIG,
          multi: true,
          useValue: <StoreConfig> {
            module: args.module, children: args.children || [],
                reducer: args.reducer,
          }
        },
        Store, {
          provide: REDUX_DEVTOOLS_EXTENSION,
          useValue:
              Object.assign({serialize: {options: true}}, args.devtoolsOptions)
        }
      ]
    };
  }

  static forChild(args: StoreConfig): ModuleWithProviders {
    return {
      ngModule: StoreModule,
      providers: [
        {
          provide: STORE_CONFIG,
          multi: true,
          useValue: <StoreConfig> {
            module: args.module, children: args.children || [],
                reducer: args.reducer
          }
        },
        Store
      ]
    };
  }

  constructor(
      private rootState: RootState,
      // Inject this so it gets instantiated.
      private reduxDevtoolsExtension: ReduxDevtoolsExtension,
      @Inject(STORE_CONFIG) private storeConfigs: StoreConfig[]) {
    const childNodes: Set<Type<any>> = new Set<Type<any>>();
    storeConfigs.map(config => config.children || []).forEach(children => {
      for (const child of children) {
        childNodes.add(child);
      }
    });
    const rootCandidates: Type<any>[] =
        storeConfigs.map(config => config.module)
            .filter(module => !childNodes.has(module));
    if (rootCandidates.length !== 1) {
      throw new Error('Invalid module tree configuration.');
    }

    // Build the reducer tree.
    function getStoreConfig(node) {
      return storeConfigs.find(config => config.module === node);
    }

    function toSpecificationNode(storeConfig): SpecificationNode {
      return <SpecificationNode>{
        module: storeConfig.module,
        reducer: storeConfig.reducer || (x => x),
        state: null,
        children: storeConfig.children.map(
            module => toSpecificationNode(getStoreConfig(module)))
      };
    }
    this.rootState.initialize(
        toSpecificationNode(getStoreConfig(rootCandidates[0])));
  }

  ngOnDestroy() {
    //   this.features.forEach(
    //       feature => this.reducerManager.removeFeature(feature));
  }
}