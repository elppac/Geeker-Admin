import { isFn, isValid } from "@formily/shared";
import { LifeCycle, Page } from "../models";
import { type AnyFunction } from "../types";
import { isPage } from "./checkers";
import { GlobalState } from "./constants";

export const createEffectHook = <F extends (payload: any, ...ctxs: any[]) => AnyFunction>(type: string, callback?: F) => {
  return (...args: Parameters<ReturnType<F>>) => {
    if (GlobalState.effectStart) {
      GlobalState.lifecycles.push(
        new LifeCycle(type, (payload, ctx) => {
          if (isFn(callback)) {
            callback(payload, ctx, ...GlobalState.context)(...args);
          }
        })
      );
    } else {
      throw new Error("Effect hooks cannot be used in asynchronous function body");
    }
  };
};

export const createEffectContext = <T = any>(defaultValue?: T) => {
  let index: number;
  return {
    provide(value?: T) {
      if (GlobalState.effectStart) {
        index = GlobalState.context.length;
        GlobalState.context[index] = isValid(value) ? value : defaultValue;
      } else {
        throw new Error("Provide method cannot be used in asynchronous function body");
      }
    },
    consume(): T {
      if (!GlobalState.effectStart) {
        throw new Error("Consume method cannot be used in asynchronous function body");
      }
      return GlobalState.context[index];
    }
  };
};

const PageEffectContext = createEffectContext<Page>();

export const useEffectPage = PageEffectContext.consume;

export const runEffects = <Context>(context?: Context, ...args: ((context: Context) => void)[]): LifeCycle[] => {
  GlobalState.lifecycles = [];
  GlobalState.context = [];
  GlobalState.effectStart = true;
  GlobalState.effectEnd = false;
  if (isPage(context)) {
    PageEffectContext.provide(context);
  }
  args.forEach(effects => {
    if (isFn(effects)) {
      effects(context);
    }
  });
  GlobalState.context = [];
  GlobalState.effectStart = false;
  GlobalState.effectEnd = true;
  return GlobalState.lifecycles;
};
