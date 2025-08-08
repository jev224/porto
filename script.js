const stack = document.querySelector(".desktop .stack");
const stackRect = stack.getBoundingClientRect();

const dock = document.querySelector(".desktop .dock .container");
const dockRect = dock.getBoundingClientRect();

const panel = document.querySelector(".desktop .panel");
const panelRect = panel.getBoundingClientRect();
const panelHeight = Math.ceil(panelRect.height) * 2;

const RESIZE_OFFSET = 4;
const WINDOW_OFFSET = 8;

const Direction = {
      TOPLEFT: 1,
      TOPRIGHT: 2,
      BOTTOMLEFT: 3,
      BOTTOMRIGHT: 4,
      TOP: 5,
      BOTTOM: 6,
      LEFT: 7,
      RIGHT: 8,
};

const Control = {
      close: "close",
      maximize: "maximize",
      minimize: "minimize",
};

for (const item of stack.children) {
      if (!item.classList.contains("window")) continue;

      const style = getComputedStyle(item);
      const minWidth = parseFloat(style.minWidth);
      const minHeight = parseFloat(style.minHeight);

      const icon = [...dock.children].find((e) => e.id === item.id);

      let selectedControl = null;
      let prevStyle = {};
      let maximized = false;
      let minimized = false;
      let minimizing;

      let offsetX = 0;
      let offsetY = 0;

      let lastWidth = 0;
      let lastHeight = 0;
      let lastLeft = 0;
      let lastTop = 0;

      let lastPosX = 0;
      let lastPosY = 0;

      let moving = false;
      let resizing = false;
      let resizeDirection = 0;

      item.addEventListener("pointerdown", (e) => {
            const target = e.target;
            if (!target) return;

            const isHeader = target.tagName === "HEADER" || target.classList.contains("header-label");
            const isButton = target.tagName === "BUTTON";

            const rect = item.getBoundingClientRect();
            item.setPointerCapture(e.pointerId);

            if (resizeDirection > 0) {
                  resizing = true;
                  lastPosX = e.clientX;
                  lastPosY = e.clientY;
                  lastWidth = rect.width;
                  lastHeight = rect.height;
                  lastLeft = rect.x;
                  lastTop = rect.y;
            } else if (isHeader) {
                  offsetX = e.clientX - rect.left;
                  offsetY = e.clientY - rect.top;
                  moving = true;
            } else if (isButton) {
                  const val = [...target.classList].find((c) => c in Control);
                  if (val) selectedControl = val;
            }
      });

      item.addEventListener("mousemove", (e) => {
            const x = e.clientX;
            const y = e.clientY;
            const rect = item.getBoundingClientRect();

            if (moving) {
                  if (maximized) {
                        offsetX = (parseFloat(prevStyle.width) * e.clientX) / rect.width;

                        Object.assign(item.style, {
                              width: prevStyle.width,
                              height: prevStyle.height,
                        });

                        maximized = false;
                  }

                  item.style.left = x - offsetX + "px";
                  item.style.top = y - offsetY + "px";
                  return;
            }

            if (e.target.tagName !== "BUTTON") selectedControl = null;
            if (maximized) return;

            if (resizing) {
                  const offsetX = lastPosX - x;
                  const offsetY = lastPosY - y;

                  let newTop = lastTop;
                  let newLeft = lastLeft;
                  let newWidth = lastWidth;
                  let newHeight = lastHeight;

                  switch (resizeDirection) {
                        case Direction.TOPLEFT:
                              newHeight += offsetY;
                              newTop -= offsetY;

                              newWidth += offsetX;
                              newLeft -= offsetX;
                              break;
                        case Direction.TOPRIGHT:
                              newHeight += offsetY;
                              newTop -= offsetY;

                              newWidth -= offsetX;
                              break;
                        case Direction.BOTTOMLEFT:
                              newHeight -= offsetY;

                              newWidth += offsetX;
                              newLeft -= offsetX;
                              break;
                        case Direction.BOTTOMRIGHT:
                              newHeight -= offsetY;

                              newWidth -= offsetX;
                              break;
                        case Direction.LEFT:
                              newWidth += offsetX;
                              newLeft -= offsetX;

                              break;
                        case Direction.RIGHT:
                              newWidth -= offsetX;
                              break;
                        case Direction.TOP:
                              newHeight += offsetY;
                              newTop -= offsetY;
                              break;
                        case Direction.BOTTOM:
                              newHeight -= offsetY;
                              break;
                        default:
                              console.warn(`Unknown resize direction: ${resizeDirection}`);
                              return;
                  }

                  // Apply styles
                  if (newWidth >= minWidth) {
                        item.style.width = `${newWidth}px`;
                        item.style.left = `${newLeft}px`;
                  }

                  if (newHeight >= minHeight) {
                        item.style.height = `${newHeight}px`;
                        item.style.top = `${newTop}px`;
                  }

                  return;
            }

            const offset = RESIZE_OFFSET;

            const left = x >= rect.x + WINDOW_OFFSET - offset && x <= rect.x + WINDOW_OFFSET + offset;
            const right = x >= rect.x + rect.width - WINDOW_OFFSET - offset && x <= rect.x + rect.width - WINDOW_OFFSET + offset;
            const top = y >= rect.y + WINDOW_OFFSET - offset && y <= rect.y + WINDOW_OFFSET + offset;
            const bottom = y >= rect.y + rect.height - WINDOW_OFFSET - offset && y <= rect.y + rect.height - WINDOW_OFFSET + offset;

            if (top && left) {
                  item.style.cursor = "se-resize";
                  resizeDirection = Direction.TOPLEFT;
            } else if (top && right) {
                  item.style.cursor = "sw-resize";
                  resizeDirection = Direction.TOPRIGHT;
            } else if (bottom && left) {
                  item.style.cursor = "ne-resize";
                  resizeDirection = Direction.BOTTOMLEFT;
            } else if (bottom && right) {
                  item.style.cursor = "nw-resize";
                  resizeDirection = Direction.BOTTOMRIGHT;
            } else if (left) {
                  item.style.cursor = "e-resize";
                  resizeDirection = Direction.LEFT;
            } else if (right) {
                  item.style.cursor = "w-resize";
                  resizeDirection = Direction.RIGHT;
            } else if (top) {
                  item.style.cursor = "n-resize";
                  resizeDirection = Direction.TOP;
            } else if (bottom) {
                  item.style.cursor = "s-resize";
                  resizeDirection = Direction.BOTTOM;
            } else {
                  item.style.cursor = "default";
                  resizeDirection = 0;
            }
      });

      const stopMoving = () => {
            moving = false;
            resizing = false;
            if (!resizing) {
                  item.style.cursor = "default";
                  resizeDirection = 0;
            }
      };

      icon.addEventListener("click", () => {
            const rect = item.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();

            item.style.transformOrigin = "top left";
            if (minimizing) return;
            minimizing = true;

            if (minimized) {
                  item.style.opacity = 1;

                  const anim = item.animate(
                        [
                              {
                                    top: iconRect.top + "px",
                                    left: iconRect.left + "px",
                                    scale: iconRect.width / rect.width,
                              },
                              {
                                    top: item.style.top,
                                    left: item.style.left,
                                    scale: 1,
                              },
                        ],
                        {
                              duration: 300,
                              easing: "cubic-bezier(.26,0,.06,1.01)",
                        }
                  );

                  anim.onfinish = () => {
                        minimizing = false;
                        item.style.transformOrigin = "center center";
                  };

                  minimized = false;
            } else {
                  const anim = item.animate(
                        { top: iconRect.top + "px", left: iconRect.left + "px", scale: iconRect.width / rect.width },
                        {
                              duration: 300,
                              easing: "cubic-bezier(.26,0,.06,1.01)",
                        }
                  );

                  anim.onfinish = () => {
                        item.style.opacity = 0;
                        minimizing = false;
                  };

                  minimized = true;
            }
      });

      item.addEventListener("pointerup", (e) => {
            stopMoving();

            if (!selectedControl) return;

            if (selectedControl === Control.close) {
                  const anim = item.animate(
                        { transform: "scale(0.7)", opacity: 0 },

                        {
                              duration: 500,
                              easing: "cubic-bezier(.26,0,.06,1.01)",
                        }
                  );

                  anim.onfinish = () => {
                        item.style.display = "none";
                        item.style.visibility = "hidden";
                  };
            }

            if (selectedControl === Control.minimize) {
                  const rect = item.getBoundingClientRect();
                  const iconRect = icon.getBoundingClientRect();

                  minimizing = true;

                  const style = getComputedStyle(item);
                  prevStyle = {
                        top: style.top,
                        left: style.left,
                        width: style.width,
                        height: style.height,
                  };
                  item.style.transformOrigin = "top left";

                  const anim = item.animate(
                        {
                              top: iconRect.top + "px",
                              left: iconRect.left + "px",
                              scale: iconRect.width / rect.width,
                        },

                        {
                              duration: 300,
                              easing: "cubic-bezier(.26,0,.06,1.01)",
                        }
                  );

                  anim.onfinish = () => {
                        item.style.opacity = 0;
                        minimizing = false;
                  };
            }

            if (selectedControl === Control.maximize) {
                  let props = {};

                  if (maximized) {
                        props = prevStyle;

                        maximized = false;
                  } else {
                        const style = getComputedStyle(item);
                        prevStyle = {
                              top: style.top,
                              left: style.left,
                              width: style.width,
                              height: style.height,
                        };

                        props = {
                              top: panelRect.height + "px",
                              left: -WINDOW_OFFSET + "px",
                              width: stackRect.width + WINDOW_OFFSET * 2 + "px",
                              height: dockRect.y - panelRect.height + "px",
                        };

                        maximized = true;
                  }

                  const anim = item.animate(props, {
                        duration: 500,
                        easing: "cubic-bezier(.26,0,.06,1.01)",
                  });

                  anim.onfinish = () => {
                        Object.assign(item.style, props);
                  };
            }

            selectedControl = null;
      });
      document.addEventListener("contextmenu", stopMoving);
}
