import React from "react";
import { Modal as AntModal } from "antd";

export function Modal({ children, title, ...props }) {
    return (
        <AntModal
            title={title}
            centered
            destroyOnClose
            footer={null}
            width={props.width || 520}
            {...props}
        >
            <div className="pt-2">{children}</div>
        </AntModal>
    );
}
