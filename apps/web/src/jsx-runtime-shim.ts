import React from "react";

export const Fragment = React.Fragment;

type JSXType = React.ElementType;
type JSXProps = Record<string, unknown> | null;

function createJSXElement(type: JSXType, props: JSXProps, key?: React.Key): React.ReactElement {
  return React.createElement(type, { ...props, key });
}

export function jsx(type: JSXType, props: JSXProps, key?: React.Key): React.ReactElement {
  return createJSXElement(type, props, key);
}

export function jsxs(type: JSXType, props: JSXProps, key?: React.Key): React.ReactElement {
  return createJSXElement(type, props, key);
}

export function jsxDEV(
  type: JSXType,
  props: JSXProps,
  key?: React.Key,
  _isStaticChildren?: boolean,
  _source?: unknown,
  _self?: unknown,
): React.ReactElement {
  return createJSXElement(type, props, key);
}
