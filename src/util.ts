export function listen(eventName: string, callback: (data: any) => any) {
  addEventListener(eventName, (e: any) => {
    callback(e.detail);
  });
}

export function dispatch(eventName: string, data: any) {
  dispatchEvent(new CustomEvent(eventName, {detail: data}));
}
