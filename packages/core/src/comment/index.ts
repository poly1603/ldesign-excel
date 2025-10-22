/**
 * 评论批注系统
 * 支持单元格评论、线程回复、@提及等功能
 */

import { logger } from '../errors';

/**
 * 评论状态
 */
export enum CommentStatus {
  /** 活跃 */
  ACTIVE = 'active',
  /** 已解决 */
  RESOLVED = 'resolved',
  /** 已删除 */
  DELETED = 'deleted',
}

/**
 * 评论
 */
export interface Comment {
  /** 评论ID */
  id: string;
  /** 单元格位置 */
  cellRef: string;
  /** 工作表索引 */
  sheetIndex: number;
  /** 行号 */
  row: number;
  /** 列号 */
  col: number;
  /** 评论内容 */
  content: string;
  /** 作者 */
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  /** 创建时间 */
  createdAt: number;
  /** 修改时间 */
  updatedAt: number;
  /** 状态 */
  status: CommentStatus;
  /** 回复列表 */
  replies: CommentReply[];
  /** @提及的用户 */
  mentions: string[];
  /** 是否置顶 */
  pinned: boolean;
}

/**
 * 评论回复
 */
export interface CommentReply {
  /** 回复ID */
  id: string;
  /** 回复内容 */
  content: string;
  /** 作者 */
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  /** 创建时间 */
  createdAt: number;
  /** @提及的用户 */
  mentions: string[];
}

/**
 * 评论筛选选项
 */
export interface CommentFilterOptions {
  /** 按状态筛选 */
  status?: CommentStatus;
  /** 按作者筛选 */
  authorId?: string;
  /** 按工作表筛选 */
  sheetIndex?: number;
  /** 只显示置顶 */
  pinnedOnly?: boolean;
  /** 包含已解决的评论 */
  includeResolved?: boolean;
}

/**
 * 评论管理器
 */
export class CommentManager {
  private comments: Map<string, Comment> = new Map();
  private commentIdCounter = 0;
  private replyIdCounter = 0;

  /**
   * 添加评论
   */
  addComment(
    cellRef: string,
    sheetIndex: number,
    row: number,
    col: number,
    content: string,
    author: Comment['author']
  ): Comment {
    const comment: Comment = {
      id: this.generateCommentId(),
      cellRef,
      sheetIndex,
      row,
      col,
      content: this.parseContent(content),
      author,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: CommentStatus.ACTIVE,
      replies: [],
      mentions: this.extractMentions(content),
      pinned: false,
    };

    this.comments.set(comment.id, comment);

    logger.info('Comment added', {
      id: comment.id,
      cellRef,
      mentions: comment.mentions.length,
    });

    return comment;
  }

  /**
   * 删除评论
   */
  deleteComment(commentId: string, hardDelete = false): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    if (hardDelete) {
      this.comments.delete(commentId);
      logger.info('Comment deleted (hard)', { id: commentId });
    } else {
      comment.status = CommentStatus.DELETED;
      comment.updatedAt = Date.now();
      logger.info('Comment deleted (soft)', { id: commentId });
    }

    return true;
  }

  /**
   * 更新评论
   */
  updateComment(commentId: string, content: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    comment.content = this.parseContent(content);
    comment.mentions = this.extractMentions(content);
    comment.updatedAt = Date.now();

    logger.debug('Comment updated', { id: commentId });
    return true;
  }

  /**
   * 解决评论
   */
  resolveComment(commentId: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    comment.status = CommentStatus.RESOLVED;
    comment.updatedAt = Date.now();

    logger.info('Comment resolved', { id: commentId });
    return true;
  }

  /**
   * 重新激活评论
   */
  reactivateComment(commentId: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    comment.status = CommentStatus.ACTIVE;
    comment.updatedAt = Date.now();

    logger.info('Comment reactivated', { id: commentId });
    return true;
  }

  /**
   * 添加回复
   */
  addReply(commentId: string, content: string, author: CommentReply['author']): CommentReply | null {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return null;
    }

    const reply: CommentReply = {
      id: this.generateReplyId(),
      content: this.parseContent(content),
      author,
      createdAt: Date.now(),
      mentions: this.extractMentions(content),
    };

    comment.replies.push(reply);
    comment.updatedAt = Date.now();

    logger.debug('Reply added', {
      commentId,
      replyId: reply.id,
      mentions: reply.mentions.length,
    });

    return reply;
  }

  /**
   * 删除回复
   */
  deleteReply(commentId: string, replyId: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    const index = comment.replies.findIndex((r) => r.id === replyId);
    if (index > -1) {
      comment.replies.splice(index, 1);
      comment.updatedAt = Date.now();
      logger.debug('Reply deleted', { commentId, replyId });
      return true;
    }

    return false;
  }

  /**
   * 置顶/取消置顶评论
   */
  togglePin(commentId: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    comment.pinned = !comment.pinned;
    comment.updatedAt = Date.now();

    logger.debug('Comment pin toggled', { id: commentId, pinned: comment.pinned });
    return true;
  }

  /**
   * 获取单元格的评论
   */
  getCommentsByCell(cellRef: string): Comment[] {
    return Array.from(this.comments.values()).filter(
      (c) => c.cellRef === cellRef && c.status !== CommentStatus.DELETED
    );
  }

  /**
   * 获取工作表的所有评论
   */
  getCommentsBySheet(sheetIndex: number, options?: CommentFilterOptions): Comment[] {
    let comments = Array.from(this.comments.values()).filter(
      (c) => c.sheetIndex === sheetIndex
    );

    // 应用筛选
    if (options) {
      if (options.status) {
        comments = comments.filter((c) => c.status === options.status);
      }

      if (options.authorId) {
        comments = comments.filter((c) => c.author.id === options.authorId);
      }

      if (options.pinnedOnly) {
        comments = comments.filter((c) => c.pinned);
      }

      if (!options.includeResolved) {
        comments = comments.filter((c) => c.status !== CommentStatus.RESOLVED);
      }
    }

    return comments;
  }

  /**
   * 获取所有评论
   */
  getAllComments(options?: CommentFilterOptions): Comment[] {
    let comments = Array.from(this.comments.values());

    if (options) {
      if (options.status) {
        comments = comments.filter((c) => c.status === options.status);
      }

      if (options.authorId) {
        comments = comments.filter((c) => c.author.id === options.authorId);
      }

      if (options.sheetIndex !== undefined) {
        comments = comments.filter((c) => c.sheetIndex === options.sheetIndex);
      }

      if (options.pinnedOnly) {
        comments = comments.filter((c) => c.pinned);
      }

      if (!options.includeResolved) {
        comments = comments.filter((c) => c.status !== CommentStatus.RESOLVED);
      }
    }

    return comments.sort((a, b) => {
      // 置顶的在前
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // 按时间倒序
      return b.updatedAt - a.updatedAt;
    });
  }

  /**
   * 提取 @提及
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * 解析内容
   */
  private parseContent(content: string): string {
    // 这里可以添加 Markdown 解析等功能
    return content.trim();
  }

  /**
   * 生成评论ID
   */
  private generateCommentId(): string {
    return `comment_${Date.now()}_${++this.commentIdCounter}`;
  }

  /**
   * 生成回复ID
   */
  private generateReplyId(): string {
    return `reply_${Date.now()}_${++this.replyIdCounter}`;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    active: number;
    resolved: number;
    deleted: number;
    withReplies: number;
    pinned: number;
  } {
    const all = Array.from(this.comments.values());

    return {
      total: all.length,
      active: all.filter((c) => c.status === CommentStatus.ACTIVE).length,
      resolved: all.filter((c) => c.status === CommentStatus.RESOLVED).length,
      deleted: all.filter((c) => c.status === CommentStatus.DELETED).length,
      withReplies: all.filter((c) => c.replies.length > 0).length,
      pinned: all.filter((c) => c.pinned).length,
    };
  }

  /**
   * 清空所有评论
   */
  clear(): void {
    this.comments.clear();
    logger.info('All comments cleared');
  }

  /**
   * 导出评论
   */
  export(): string {
    return JSON.stringify(Array.from(this.comments.values()), null, 2);
  }

  /**
   * 导入评论
   */
  import(json: string): boolean {
    try {
      const imported: Comment[] = JSON.parse(json);
      imported.forEach((comment) => {
        this.comments.set(comment.id, comment);
      });
      logger.info('Comments imported', { count: imported.length });
      return true;
    } catch (error) {
      logger.error('Failed to import comments', error as Error);
      return false;
    }
  }
}


