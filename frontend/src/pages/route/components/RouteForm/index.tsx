import i18n, { lngs } from '@/i18n';
import { OptionItem } from '@/interfaces/common';
import { DEFAULT_DOMAIN, Domain } from '@/interfaces/domain';
import { upstreamServiceToString } from '@/interfaces/route';
import { getGatewayDomains, getGatewayServices } from '@/services';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Checkbox, Form, Input, Select, Tooltip } from 'antd';
import { uniqueId } from "lodash";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FactorGroup from '../FactorGroup';
import KeyValueGroup from '../KeyValueGroup';

const { Option } = Select;

const MethodOptions = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
  { label: "OPTIONS", value: "OPTIONS" },
  { label: "HEAD", value: "HEAD" },
  { label: "PATCH", value: "PATCH" },
  { label: "TRACE", value: "TRACE" },
  { label: "CONNECT", value: "CONNECT" },
];

const RouteForm: React.FC = forwardRef((props, ref) => {
  const { t } = useTranslation();

  const { value } = props;
  const [form] = Form.useForm();
  const [serviceOptions, setServiceOptions] = useState<OptionItem[]>([]);
  const [domainOptions, setDomainOptions] = useState<OptionItem[]>([]);
  const servicesRef = useRef(new Map());
  const { data: _services = [] } = useRequest(getGatewayServices);
  const { data: _domains = [] } = useRequest(getGatewayDomains);

  useEffect(() => {
    form.resetFields();
    const _serviceOptions: OptionItem[] = [];
    const serviceKeys = new Set<string>()
    _services && _services.forEach(service => {
      const text = upstreamServiceToString(service);
      if (serviceKeys.has(text)) {
        // Ignore duplicated keys to avoid UI refresh issues.
        return;
      }
      serviceKeys.add(text)
      _serviceOptions.push({ label: text, value: text });
      servicesRef.current.set(text, service);
    });
    setServiceOptions(_serviceOptions);
    const _domainOptions: OptionItem[] = [];
    const domains = _domains as Domain[];
    domains && domains.forEach(domain => {
      const { name } = domain;
      name !== DEFAULT_DOMAIN && _domainOptions.push({ label: name, value: name });
    });
    setDomainOptions(_domainOptions);

    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const { name, domains, path, headers, methods, urlParams, services, customConfigs } = value;
      headers && headers.map((header) => {
        return { ...header, uid: uniqueId() };
      });
      urlParams && urlParams.map((query) => {
        return { ...query, uid: uniqueId() };
      });
      const customConfigArray = customConfigs ? Object.keys(customConfigs).map((key) => {
        return { uid: uniqueId(), key, value: customConfigs[key] };
      }) : [];
      form.setFieldsValue({
        name,
        domains: domains || [],
        path: Object.assign({ ...path }, { ignoreCase: path.caseSensitive === false ? ['ignore'] : [] }),
        methods: methods || [],
        headers: headers || [],
        urlParams: urlParams || [],
        services: services ? services.map(upstreamServiceToString) : null,
        customConfigs: customConfigArray,
      });
    }
  }, [_services, _domains, value]);

  useImperativeHandle(ref, () => ({
    reset: () => form.resetFields(),
    handleSubmit: async () => {
      const values = await form.validateFields();
      if (values.domains && !Array.isArray(values.domains)) {
        values.domains = [values.domains];
      }
      if (values.customConfigs) {
        const customConfigsObj = {};
        for (const config of values.customConfigs) {
          if (config.key) {
            customConfigsObj[config.key] = config.value || '';
          }
        }
        values.customConfigs = customConfigsObj;
      }
      return values;
    },
  }));

  const lang = i18n.language;
  const langConfig = lngs.find(l => l.code === lang);
  const officialSiteLang = langConfig?.officialSiteCode || lang.toLowerCase();

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Form.Item
        label={t('route.routeForm.routeName')}
        required
        name="name"
        tooltip={t('route.routeForm.routeNameTip')}
        rules={[
          {
            required: true,
            pattern: /^[a-z0-9][a-z0-9.-]*$/,
            message: t('route.routeForm.routeNameRequired'),
          },
        ]}
      >
        <Input
          showCount
          allowClear
          disabled={value}
          maxLength={63}
          placeholder={t('route.routeForm.routeNamePlaceholder')}
        />
      </Form.Item>
      <Form.Item
        label={t('route.routeForm.domain')}
        name="domains"
      >
        <Select
          showSearch
          allowClear
          mode="single"
          placeholder={t('route.routeForm.domainSearchPlaceholder')}
          options={domainOptions}
        />
      </Form.Item>
      <Form.Item
        label={t('route.routeForm.matchType')}
        required
        tooltip={t('route.routeForm.matchTypeTooltip')}
      >
        <Form.Item label={t('route.routeForm.path')} required>
          <Input.Group compact>
            <Form.Item
              name={['path', 'matchType']}
              noStyle
              rules={[
                {
                  required: true,
                  message: t('route.routeForm.pathPredicatesRequired'),
                },
              ]}
            >
              <Select
                style={{ width: '20%' }}
                placeholder={t('route.routeForm.matchType')}
              >
                <Option value="PRE">{t('route.matchTypes.PRE')}</Option>
                <Option value="EQUAL">{t('route.matchTypes.EQUAL')}</Option>
                <Option value="REGULAR">{t('route.matchTypes.REGULAR')}</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name={['path', 'matchValue']}
              noStyle
              rules={[
                {
                  required: true,
                  message: t('route.routeForm.pathMatcherRequired'),
                },
              ]}
            >
              <Input style={{ width: '60%' }} placeholder={t('route.routeForm.pathMatcherPlacedholder')} />
            </Form.Item>
            <Form.Item
              name={['path', 'ignoreCase']}
              noStyle
            >
              <Checkbox.Group
                options={[
                  {
                    label: t('route.routeForm.caseInsensitive'), value: 'ignore',
                  },
                ]}
                style={{ width: '18%', display: 'inline-flex', marginLeft: 12, marginTop: 4 }}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item
          label={t('route.routeForm.method')}
          name="methods"
        >
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder={t('route.routeForm.methodMatcherPlaceholder')}
            options={MethodOptions}
          />
        </Form.Item>
        <Form.Item
          label={t('route.routeForm.header')}
          name="headers"
          tooltip={t('route.routeForm.headerTooltip')}
        >
          <FactorGroup />
        </Form.Item>
        <Form.Item
          label={t('route.routeForm.query')}
          name="urlParams"
          tooltip={t('route.routeForm.queryTooltip')}
        >
          <FactorGroup />
        </Form.Item>
        <Form.Item
          label={
            <>
              {t('route.routeForm.customConfigs')}
              <Tooltip title={t('route.routeForm.customConfigsTip')}>
                <a href={`https://higress.io/${officialSiteLang}/docs/user/annotation-use-case`} target="_blank">
                  <QuestionCircleOutlined className="ant-form-item-tooltip" />
                </a>
              </Tooltip>
            </>
          }
          name="customConfigs"
        >
          <KeyValueGroup />
        </Form.Item>
        <Form.Item
          label={t('route.routeForm.targetService')}
          required
          name="services"
          rules={[
            {
              required: true,
              message: t('route.routeForm.targetServiceRequired'),
            },
          ]}
        >
          <Select
            mode="multiple"
            showSearch
            allowClear
            placeholder={t('route.routeForm.targetServiceNamedPlaceholder')}
            options={serviceOptions}
          />
        </Form.Item>
      </Form.Item>
    </Form>
  );
});

export default RouteForm;
