import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import {
  Form, Card, Col, Row, Input,
  Radio, Tag, Popover, Table,
  Switch, Select, Button, message,
  Popconfirm, Modal, Spin
} from 'antd'

import { channelTable } from '../../utils/stringTable'

const FormItem = Form.Item
const { TextArea } = Input
const Option = Select.Option
const confirm = Modal.confirm

class PointTrackDetailView extends Component {
  static propTypes = {
    match: PropTypes.object,
    form: PropTypes.object,
    history: PropTypes.object,
    loading: PropTypes.bool,
    trackDetailStore: PropTypes.object,
    pointProps: PropTypes.array,
    isEditor: PropTypes.bool,
    formData: PropTypes.object,
    batchList: PropTypes.object
  }

  constructor (props) {
    super(props)
    const { action, pointId } = this.props.match.params
    this.action = action
    this.isNew = action === 'new'
    this.pointId = pointId
    this.props.trackDetailStore.fetchBatchByChannelAndStatus([0, 2])
    if (!this.isNew) {
      this.props.trackDetailStore.getPointById(pointId)
    } else {
      this.props.trackDetailStore.resetForm()
    }
  }

  handleAddProp = () => {
    this.props.trackDetailStore.addProp()
  }

  handleRemoveProp = (uid) => {
    this.props.trackDetailStore.removeProp(uid)
  }

  handlerTableChange = (record, value, key) => {
    this.props.trackDetailStore.setPropValue(record, value, key)
  }

  handlerEnumTableChange = (parentUid, record, value, key) => {
    this.props.trackDetailStore.setEnumPropValue(parentUid, record, value, key)
  }

  handleAddEnumList = (uid) => {
    this.props.trackDetailStore.addEnumList(uid)
  }

  handlerSubmitPoint = () => {
    console.log('props:', this.props.pointProps)
    this.props.form.validateFieldsAndScroll((err) => {
      if (err) return
      const formData = this.props.form.getFieldsValue()
      if (this.isNew) {
        this.props.trackDetailStore.submit(formData)
          .then(res => {
            if (res) {
              this.props.history.replace({ pathname: '/home/point-track/new/0' })
              message.success('保存成功！', 3)
            } else {
              message.error('保存失败！', 3)
            }
          })
          .catch(err => {
            message.error(err.response.data.msg, 3)
          })
      } else if (this.action === 'detail') {
        confirm({
          title: '警告',
          content: '同一个埋点，同一时间只有一个版本会处于激活状态，新创建的版本会自动启动，之前的版本会自动进入未启动状态',
          okText: '创建',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => {
            this.props.trackDetailStore.addNewVersion(formData)
              .then(res => {
                if (res) {
                  this.props.history.replace({ pathname: '/home/point-track' })
                  message.success('创建新版本成功', 3)
                } else {
                  message.error('船舰新版本失败', 3)
                }
              })
              .catch(err => {
                message.error(err.response.data.msg, 3)
              })
          }
        })
      }
    })
  }

  handlerDeletePoint = (pointId) => {
    this.props.trackDetailStore.deletePoint(pointId)
      .then(res => {
        if (res) {
          message.success('删除成功!', 2, () => {
            this.props.history.replace({ pathname: '/home/point-track' })
          })
        } else {
          message.error('删除失败！', 3)
        }
      })
      .catch(err => {
        message.error(err.response.data.msg, 3)
      })
  }

  handlerUpdataPoint = () => {
    confirm({
      title: '警告',
      content: '请勿修改线上埋点参数属性后，点击更新！除非你已经知道这意味着什么，这种情况更建议创建新版本',
      okText: '更新',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        this.props.form.validateFieldsAndScroll((err) => {
          if (err) return
          let formData = this.props.form.getFieldsValue()
          formData.pointid = this.pointId
          this.props.trackDetailStore.updataPoint(formData)
            .then(res => {
              if (res) {
                message.success('更新成功!', 3)
              } else {
                message.error('更新失败!', 3)
              }
            })
            .catch(err => {
              message.error(err.response.data.msg, 3)
            })
        })
      }
    })
  }

  /**
   * 暂停埋点
   */
  handlerClicStopPoint = () => {
    const pointId = this.pointId
    confirm({
      title: '警告',
      content: '将会停用该 channel 下的该版本埋点',
      okText: '停用',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        this.props.trackDetailStore.changePointStatus(pointId, 'stop')
          .then(res => {
            if (res) {
              message.success('停用成功！', 3)
            }
          })
          .catch(err => {
            message.error(err.response.data.msg, 3)
          })
      }
    })
  }

  /**
   * 重新启用埋点
   */
  handlerClickStartPoint = () => {
    const pointId = this.pointId
    confirm({
      title: '警告',
      content: '启用该版本埋点，将会自动停用其他版本埋点，只会影响同 channel 的埋点，比如 android，ios',
      okText: '启用',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        this.props.trackDetailStore.changePointStatus(pointId, 'start')
          .then(res => {
            if (res) {
              message.success('启用成功！', 3)
            }
          })
          .catch(err => {
            message.error(err.response.data.msg, 3)
          })
      }
    })
  }

  renderInputColumns = (text, record, key) => {
    if (this.props.isEditor) {
      return (
        <Input
          placeholder="请输入"
          defaultValue={record[key]}
          onChange={(e) => this.handlerTableChange(record, e.target.value, key)}
        />
      )
    }

    return (
      <span>{record[key]}</span>
    )
  }

  renderEnumColumns = (parentId, record, key) => {
    if (this.props.isEditor) {
      return (
        <Input
          placeholder="请输入"
          defaultValue={record[key]}
          onChange={(e) => this.handlerEnumTableChange(parentId, record, e.target.value, key)}
        />
      )
    }

    return (
      <span>{record[key]}</span>
    )
  }

  renderSelectColumns = (text, record, key) => {
    if (this.props.isEditor) {
      return (
        <Select defaultValue={text} onChange={(value) => this.handlerTableChange(record, value, key)}>
          <Option value="string">String</Option>
          <Option value="number">Number</Option>
          <Option value="integer">Integer</Option>
          <Option value="enum">Enum</Option>
          <Option value="boolean">Boolean</Option>
          <Option value="object">Object</Option>
          <Option value="array">Array</Option>
        </Select>
      )
    }

    return (
      <span>{text}</span>
    )
  }

  renderSwitchColumns = (text, record, key) => {
    if (this.props.isEditor) {
      return (
        <Switch
          onChange={(value) => this.handlerTableChange(record, value, key)}
          defaultChecked={record.isRequire}
          checkedChildren="Y"
          unCheckedChildren="N"
        />
      )
    }

    return (
      <span>
        {
          record.isRequire
            ? (<Tag color="green">必须</Tag>)
            : (<Tag color="blue">非必须</Tag>)
        }
      </span>
    )
  }

  renderEnumTable = (record) => {
    if (!record.enum) return null
    const parentUid = record.uid
    const columns = [
      {
        title: '枚举key',
        dataIndex: 'value',
        key: 'value',
        render: (text, record) => this.renderEnumColumns(parentUid, record, 'value')
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type'
      },
      {
        title: '描述',
        dataIndex: 'desc',
        key: 'desc',
        render: (text, record) => this.renderEnumColumns(parentUid, record, 'desc')
      },
      {
        title: '操作',
        dataIndex: 'operation',
        key: 'operation',
        render: (text, record) => (
          this.props.isEditor
            ? (
              <span className="table-operation">
                <a
                  href="javascript:void(0)"
                  onClick={() => this.props.trackDetailStore.deletEnumList(parentUid, record.uid)}
                >Delete</a>
              </span>
            ) : (<span>空</span>)
        )
      }
    ]
    return (
      <Table
        columns={columns}
        dataSource={record.enum.slice()}
        pagination={false}
        rowKey="uid"
      />
    )
  }

  renderActionButton = () => {
    const isNew = this.isNew
    if (isNew) {
      return (
        <Col span={24} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon="to-top"
            style={{ marginLeft: 8 }}
            onClick={this.handlerSubmitPoint}
          >新建埋点</Button>
        </Col>
      )
    } else {
      return (
        <Col span={24} style={{ textAlign: 'right' }}>
          <Popconfirm title="发自内心的想删除?" onConfirm={() => { this.handlerDeletePoint(this.pointId) }} okText="删除" cancelText="取消">
            <Button
              type="danger"
              size="large"
              icon="delete"
            >删除</Button>
          </Popconfirm>
          <Button
            type="primary"
            size="large"
            icon="edit"
            style={{ marginLeft: 8 }}
            onClick={this.handlerUpdataPoint}
          >更新</Button>
          <Button
            type="primary"
            size="large"
            icon="to-top"
            style={{ marginLeft: 8 }}
            onClick={this.handlerSubmitPoint}
          >新增版本</Button>
        </Col>
      )
    }
  }

  render () {
    const { getFieldDecorator } = this.props.form
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    }

    const columns = [{
      title: '字段',
      dataIndex: 'propName',
      key: 'propName',
      render: (text, record) => this.renderInputColumns(text, record, 'propName')
    }, {
      title: '类型',
      dataIndex: 'propType',
      key: 'propType',
      render: (text, record) => this.renderSelectColumns(text, record, 'propType')
    }, {
      title: '是否必须',
      dataIndex: 'isRequire',
      key: 'isRequire',
      render: (text, record) => this.renderSwitchColumns(text, record, 'isRequire')
    }, {
      title: '描述',
      dataIndex: 'desc',
      key: 'desc',
      render: (text, record) => this.renderInputColumns(text, record, 'desc')
    }, {
      title: '操作',
      key: 'action',
      render: (text, record) => (
        this.props.isEditor
          ? (
            <span className="table-operation">
              <a href="javascript:void(0)" onClick={() => { this.handleRemoveProp(record.uid) }}>Delete</a>
              { record.propType === 'enum' ? <span className="ant-divider" /> : null }
              { record.propType === 'enum' ? <a href="javascript:void(0)" onClick={() => { this.handleAddEnumList(record.uid) }}>Add Enum</a> : null}
            </span>
          ) : (<span>空</span>)
      )
    }]

    const {
      channel = '1',
      eventkey,
      eventcategory,
      desc,
      version,
      hascommon,
      business_line,
      batch_id,
      status
    } = this.props.formData

    const isNew = this.isNew
    const renderChannelGroup = (isNewAction) => {
      if (isNewAction) {
        return (
          <Radio.Group>
            <Radio.Button value="1">Mobile</Radio.Button>
            <Radio.Button value="2">Android</Radio.Button>
            <Radio.Button value="3">iOS</Radio.Button>
            <Radio.Button value="4">PC</Radio.Button>
            <Radio.Button value="5">H5</Radio.Button>
          </Radio.Group>
        )
      }
      return (
        <Radio.Group>
          <Radio.Button value="2">Android</Radio.Button>
          <Radio.Button value="3">iOS</Radio.Button>
          <Radio.Button value="4">PC</Radio.Button>
          <Radio.Button value="5">H5</Radio.Button>
        </Radio.Group>
      )
    }

    return (
      <div>
        <Spin spinning={this.props.loading}>
          <Row>
            <Col span={24}>
              <Card title="基础信息设置" bordered noHovering>
                <Form layout="horizontal">
                  <FormItem
                    label="埋点平台"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('channel', {
                      initialValue: channel.toString(),
                      rules: [{ required: true, message: '请选择平台' }]
                    })(
                      renderChannelGroup(isNew)
                    )}
                  </FormItem>
                  <FormItem
                    label="所属分线"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('business_line', {
                      initialValue: business_line.toString(),
                      rules: [{ required: true, message: '请选择分线!' }]
                    })(
                      <Select>
                        <Option value="1">引导体系线</Option>
                        <Option value="2">专业能力线</Option>
                        <Option value="3">情感能力线</Option>
                        <Option value="4">产品运营线</Option>
                      </Select>
                    )}
                  </FormItem>
                  <FormItem
                    label="所属批次"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('batch_id', {
                      initialValue: batch_id,
                      rules: [{ required: true, message: '请选择批次' }]
                    })(
                      <Select>
                        {
                          this.props.batchList.slice().map(item => (
                            <Option key={item.batchid} value={item.batchid}>{`${channelTable[item.channel]} - ${item.name}`}</Option>
                          ))
                        }
                      </Select>
                    )}
                  </FormItem>
                  <FormItem
                    label="是否有公共参数"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('hascommon', {
                      initialValue: hascommon.toString() === '1',
                      valuePropName: 'checked'
                    })(
                      <Switch checkedChildren="有" unCheckedChildren="无" />
                    )}
                  </FormItem>
                  <FormItem
                    label="埋点KEY"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('eventkey', {
                      initialValue: eventkey,
                      rules: [{ required: true, message: '请填写 eventKey!' }]
                    })(
                      isNew ? <Input placeholder="请输入" /> : <span>{eventkey}</span>
                    )}
                  </FormItem>
                  <FormItem
                    label="埋点Category"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('eventcategory', {
                      initialValue: eventcategory,
                      rules: [{ required: true, message: '请填写 eventCategory!' }]
                    })(
                      <Input placeholder="请输入" />
                    )}
                  </FormItem>
                  <FormItem
                    label="描述内容"
                    {...formItemLayout}
                  >
                    {getFieldDecorator('desc', {
                      initialValue: desc,
                      rules: [{ required: true, message: '描述一下这个埋点吧！' }]
                    })(
                      <TextArea rows={5} placeholder="请输入" />
                    )}
                  </FormItem>
                  <FormItem
                    label="版本号"
                    {...formItemLayout}
                  >
                    <Popover content={<span style={{ color: '#999' }}>新建埋点默认版本为 v1</span>} trigger="hover">
                      <Tag color="blue">{`v${version}`}</Tag>
                    </Popover>
                    { status === 1 ? <Button type="primary" onClick={this.handlerClicStopPoint}>停用该版本</Button> : null }
                    { status === 0 ? <Button type="primary" onClick={this.handlerClickStartPoint}>启用该版本</Button> : null }
                  </FormItem>
                </Form>
              </Card>
            </Col>
          </Row>
          <Row style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card title="埋点数据设置" bordered noHovering>
                <Row gutter={80}>
                  <Col span={2}>
                    <Button type="primary" icon="plus" onClick={this.handleAddProp}>属性</Button>
                  </Col>
                  <Col span={2}>
                    <Button type="primary" icon="file-text" onClick={this.props.trackDetailStore.setEditorStatue}>{this.props.isEditor ? '退出编辑' : '进入编辑'}</Button>
                  </Col>
                </Row>
                <Table
                  style={{ marginTop: 8 }}
                  columns={columns}
                  dataSource={this.props.pointProps}
                  pagination={false}
                  rowKey="uid"
                  expandedRowRender={this.renderEnumTable}
                  defaultExpandAllRows
                />
              </Card>
            </Col>
          </Row>
          <Row style={{ marginTop: 24 }}>
            { this.renderActionButton() }
          </Row>
        </Spin>
      </div>
    )
  }
}

export default inject(stores => ({
  pointProps: stores.trackDetailStore.pointProps.slice(),
  trackDetailStore: stores.trackDetailStore,
  isEditor: stores.trackDetailStore.isEditor,
  setEditorStatue: stores.trackDetailStore.setEditorStatue,
  formData: stores.trackDetailStore.formData,
  loading: stores.trackDetailStore.loading,
  batchList: stores.trackDetailStore.batchList
}))(
  observer(Form.create()(PointTrackDetailView))
)
