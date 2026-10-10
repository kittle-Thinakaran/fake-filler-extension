import ElementFiller from "src/common/element-filler";
import { findOpenContainer, findScopeContainer } from "src/common/fill-scope";
import { IFakeFillerOptions } from "src/types";

class FakeFiller {
  private elementFiller: ElementFiller;
  private clickedElement: HTMLElement | undefined;

  constructor(options: IFakeFillerOptions, profileIndex = -1) {
    this.elementFiller = new ElementFiller(options, profileIndex);
  }

  private fillAllElements(container: Document | HTMLElement): void {
    container.querySelectorAll("input:not(:disabled):not([readonly])").forEach((element) => {
      this.elementFiller.fillInputElement(element as HTMLInputElement);
    });

    container.querySelectorAll("textarea:not(:disabled):not([readonly])").forEach((element) => {
      this.elementFiller.fillTextAreaElement(element as HTMLTextAreaElement);
    });

    container.querySelectorAll("select:not(:disabled):not([readonly])").forEach((element) => {
      this.elementFiller.fillSelectElement(element as HTMLSelectElement);
    });

    container.querySelectorAll("[contenteditable]").forEach((element) => {
      this.elementFiller.fillContentEditableElement(element as HTMLElement);
    });
  }

  public setClickedElement(element: HTMLElement | undefined): void {
    this.clickedElement = element;
  }

  /**
   * Works out the container that a fill should be limited to, so that a popup or
   * a slide gets filled without touching the page behind it. Returns
   * `undefined` when the whole page should be filled.
   */
  private resolveFillScope(): HTMLElement | undefined {
    const start: HTMLElement | null = this.clickedElement || (document.activeElement as HTMLElement | null);

    if (start && start.tagName.toLowerCase() !== "body" && start.tagName.toLowerCase() !== "html") {
      return findScopeContainer(start);
    }

    // Nothing is focused. If a popup or a slide is open then that is what the
    // user is looking at, so fill only that.
    return findOpenContainer();
  }

  public fillAllInputs(): void {
    const container = this.resolveFillScope();

    this.fillAllElements(container || document);
    this.setClickedElement(undefined);
  }

  public fillThisInput(): void {
    const element = this.clickedElement || document.activeElement;

    if (element) {
      const tagName = element.tagName.toLowerCase();

      if (tagName === "input") {
        this.elementFiller.fillInputElement(element as HTMLInputElement);
      } else if (tagName === "textarea") {
        this.elementFiller.fillTextAreaElement(element as HTMLTextAreaElement);
      } else if (tagName === "select") {
        this.elementFiller.fillSelectElement(element as HTMLSelectElement);
      } else if ((element as HTMLElement).isContentEditable) {
        this.elementFiller.fillContentEditableElement(element as HTMLElement);
      }
    }

    this.setClickedElement(undefined);
  }

  public fillThisForm(): void {
    const element = this.clickedElement || document.activeElement;

    if (element && element.tagName.toLowerCase() !== "body") {
      // A popup or slide is a tighter boundary than the surrounding <form>,
      // which is often the whole page when the popup markup is rendered
      // outside of it.
      const container = findScopeContainer(element) || element.closest("form");

      if (container) {
        this.fillAllElements(container);
      }
    }

    this.setClickedElement(undefined);
  }
}

export default FakeFiller;
