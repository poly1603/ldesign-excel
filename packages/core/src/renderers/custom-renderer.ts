/**
 * 自定义渲染器系统
 * 支持富文本、图片、超链接、按钮等自定义单元格渲染
 */

import { logger } from '../errors';

/**
 * 渲染器类型
 */
export enum CustomRendererType {
  TEXT = 'text',
  RICH_TEXT = 'rich_text',
  IMAGE = 'image',
  LINK = 'link',
  BUTTON = 'button',
  CHECKBOX = 'checkbox',
  PROGRESS = 'progress',
  RATING = 'rating',
  TAG = 'tag',
  CUSTOM = 'custom',
}

/**
 * 富文本片段
 */
export interface RichTextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * 自定义渲染器配置
 */
export interface CustomRendererConfig {
  type: CustomRendererType;
  cellRef: string;
  options?: {
    // 图片选项
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    imageFit?: 'contain' | 'cover' | 'fill';

    // 链接选项
    linkUrl?: string;
    linkText?: string;
    linkTarget?: '_blank' | '_self';

    // 按钮选项
    buttonText?: string;
    buttonColor?: string;
    onClick?: () => void;

    // 进度条选项
    progressValue?: number;
    progressMax?: number;
    progressColor?: string;

    // 评分选项
    ratingValue?: number;
    ratingMax?: number;
    ratingColor?: string;

    // 标签选项
    tagText?: string;
    tagColor?: string;

    // 富文本选项
    richText?: RichTextSegment[];

    // 自定义渲染函数
    render?: (container: HTMLElement, value: any) => void;
  };
}

/**
 * 自定义渲染器管理器
 */
export class CustomRendererManager {
  private renderers: Map<string, CustomRendererConfig> = new Map();

  /**
   * 注册渲染器
   */
  register(config: CustomRendererConfig): void {
    this.renderers.set(config.cellRef, config);
    logger.debug('Custom renderer registered', { cellRef: config.cellRef, type: config.type });
  }

  /**
   * 取消注册
   */
  unregister(cellRef: string): boolean {
    return this.renderers.delete(cellRef);
  }

  /**
   * 渲染单元格
   */
  render(cellRef: string, container: HTMLElement, value: any): boolean {
    const config = this.renderers.get(cellRef);

    if (!config) {
      return false;
    }

    try {
      switch (config.type) {
        case CustomRendererType.RICH_TEXT:
          this.renderRichText(container, config.options?.richText || []);
          break;

        case CustomRendererType.IMAGE:
          this.renderImage(container, config.options);
          break;

        case CustomRendererType.LINK:
          this.renderLink(container, config.options);
          break;

        case CustomRendererType.BUTTON:
          this.renderButton(container, config.options);
          break;

        case CustomRendererType.CHECKBOX:
          this.renderCheckbox(container, value);
          break;

        case CustomRendererType.PROGRESS:
          this.renderProgress(container, config.options);
          break;

        case CustomRendererType.RATING:
          this.renderRating(container, config.options);
          break;

        case CustomRendererType.TAG:
          this.renderTag(container, config.options);
          break;

        case CustomRendererType.CUSTOM:
          if (config.options?.render) {
            config.options.render(container, value);
          }
          break;

        default:
          return false;
      }

      return true;
    } catch (error) {
      logger.error('Custom renderer failed', error as Error, { cellRef, type: config.type });
      return false;
    }
  }

  /**
   * 渲染富文本
   */
  private renderRichText(container: HTMLElement, segments: RichTextSegment[]): void {
    container.innerHTML = '';

    segments.forEach((segment) => {
      const span = document.createElement('span');
      span.textContent = segment.text;

      if (segment.bold) span.style.fontWeight = 'bold';
      if (segment.italic) span.style.fontStyle = 'italic';
      if (segment.underline) span.style.textDecoration = 'underline';
      if (segment.color) span.style.color = segment.color;
      if (segment.backgroundColor) span.style.backgroundColor = segment.backgroundColor;
      if (segment.fontSize) span.style.fontSize = `${segment.fontSize}px`;
      if (segment.fontFamily) span.style.fontFamily = segment.fontFamily;

      container.appendChild(span);
    });
  }

  /**
   * 渲染图片
   */
  private renderImage(container: HTMLElement, options?: CustomRendererConfig['options']): void {
    if (!options?.imageUrl) return;

    const img = document.createElement('img');
    img.src = options.imageUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';

    if (options.imageWidth) img.style.width = `${options.imageWidth}px`;
    if (options.imageHeight) img.style.height = `${options.imageHeight}px`;
    if (options.imageFit) img.style.objectFit = options.imageFit;

    container.innerHTML = '';
    container.appendChild(img);
  }

  /**
   * 渲染链接
   */
  private renderLink(container: HTMLElement, options?: CustomRendererConfig['options']): void {
    if (!options?.linkUrl) return;

    const link = document.createElement('a');
    link.href = options.linkUrl;
    link.textContent = options.linkText || options.linkUrl;
    link.target = options.linkTarget || '_blank';
    link.style.color = '#0066cc';
    link.style.textDecoration = 'underline';

    container.innerHTML = '';
    container.appendChild(link);
  }

  /**
   * 渲染按钮
   */
  private renderButton(container: HTMLElement, options?: CustomRendererConfig['options']): void {
    const button = document.createElement('button');
    button.textContent = options?.buttonText || 'Button';
    button.style.padding = '4px 12px';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = options?.buttonColor || '#4472C4';
    button.style.color = '#fff';

    if (options?.onClick) {
      button.onclick = options.onClick;
    }

    container.innerHTML = '';
    container.appendChild(button);
  }

  /**
   * 渲染复选框
   */
  private renderCheckbox(container: HTMLElement, value: any): void {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(value);
    checkbox.style.margin = 'auto';

    container.innerHTML = '';
    container.style.textAlign = 'center';
    container.appendChild(checkbox);
  }

  /**
   * 渲染进度条
   */
  private renderProgress(container: HTMLElement, options?: CustomRendererConfig['options']): void {
    const value = options?.progressValue || 0;
    const max = options?.progressMax || 100;
    const percentage = (value / max) * 100;
    const color = options?.progressColor || '#4472C4';

    const progressBar = document.createElement('div');
    progressBar.style.width = '100%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#f0f0f0';
    progressBar.style.borderRadius = '4px';
    progressBar.style.overflow = 'hidden';
    progressBar.style.position = 'relative';

    const fill = document.createElement('div');
    fill.style.width = `${percentage}%`;
    fill.style.height = '100%';
    fill.style.backgroundColor = color;
    fill.style.transition = 'width 0.3s ease';

    const label = document.createElement('div');
    label.textContent = `${Math.round(percentage)}%`;
    label.style.position = 'absolute';
    label.style.top = '50%';
    label.style.left = '50%';
    label.style.transform = 'translate(-50%, -50%)';
    label.style.fontSize = '11px';
    label.style.fontWeight = 'bold';

    progressBar.appendChild(fill);
    progressBar.appendChild(label);

    container.innerHTML = '';
    container.appendChild(progressBar);
  }

  /**
   * 渲染评分
   */
  private renderRating(container: HTMLElement, options?: CustomRendererConfig['options']): void {
    const value = options?.ratingValue || 0;
    const max = options?.ratingMax || 5;
    const color = options?.ratingColor || '#FFD700';

    const ratingContainer = document.createElement('div');
    ratingContainer.style.display = 'flex';
    ratingContainer.style.gap = '2px';

    for (let i = 0; i < max; i++) {
      const star = document.createElement('span');
      star.textContent = i < value ? '★' : '☆';
      star.style.color = i < value ? color : '#ddd';
      star.style.fontSize = '14px';
      ratingContainer.appendChild(star);
    }

    container.innerHTML = '';
    container.appendChild(ratingContainer);
  }

  /**
   * 渲染标签
   */
  private renderTag(container: HTMLElement, options?: CustomRendererConfig['options']): void {
    const tag = document.createElement('span');
    tag.textContent = options?.tagText || '';
    tag.style.padding = '2px 8px';
    tag.style.borderRadius = '12px';
    tag.style.fontSize = '11px';
    tag.style.backgroundColor = options?.tagColor || '#E3F2FD';
    tag.style.color = '#1976D2';
    tag.style.display = 'inline-block';

    container.innerHTML = '';
    container.appendChild(tag);
  }

  /**
   * 获取所有渲染器
   */
  getAllRenderers(): Map<string, CustomRendererConfig> {
    return new Map(this.renderers);
  }

  /**
   * 清空所有渲染器
   */
  clear(): void {
    this.renderers.clear();
    logger.info('All custom renderers cleared');
  }
}

