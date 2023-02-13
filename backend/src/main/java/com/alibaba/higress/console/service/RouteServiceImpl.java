/*
 * Copyright (c) 2022-2023 Alibaba Group Holding Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
package com.alibaba.higress.console.service;

import java.util.Collections;
import java.util.List;

import javax.annotation.Resource;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.alibaba.higress.console.controller.dto.PaginatedResult;
import com.alibaba.higress.console.controller.dto.Route;
import com.alibaba.higress.console.controller.dto.RoutePageQuery;
import com.alibaba.higress.console.controller.exception.AlreadyExistedException;
import com.alibaba.higress.console.controller.exception.BusinessException;
import com.alibaba.higress.console.service.kubernetes.KubernetesClientService;
import com.alibaba.higress.console.service.kubernetes.KubernetesModelConverter;

import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.models.V1Ingress;

@Service
public class RouteServiceImpl implements RouteService {

    private KubernetesClientService kubernetesClientService;
    private KubernetesModelConverter kubernetesModelConverter;

    @Resource
    public void setKubernetesClientService(KubernetesClientService kubernetesClientService) {
        this.kubernetesClientService = kubernetesClientService;
    }

    @Resource
    public void setKubernetesModelConverter(KubernetesModelConverter kubernetesModelConverter) {
        this.kubernetesModelConverter = kubernetesModelConverter;
    }

    @Override
    public PaginatedResult<Route> list(RoutePageQuery query) {
        List<V1Ingress> ingresses;
        if (query != null && StringUtils.isNotEmpty(query.getDomainName())) {
            ingresses = kubernetesClientService.listIngressByDomain(query.getDomainName());
        } else {
            ingresses = kubernetesClientService.listIngress();
        }
        if (CollectionUtils.isEmpty(ingresses)) {
            return PaginatedResult.createFromFullList(Collections.emptyList(), query);
        }
        List<V1Ingress> supportedIngresses =
            ingresses.stream().filter(kubernetesModelConverter::isIngressSupported).toList();
        return PaginatedResult.createFromFullList(supportedIngresses, query, kubernetesModelConverter::ingress2Route);
    }

    @Override
    public Route query(String routeName) {
        V1Ingress ingress = kubernetesClientService.readIngress(routeName);
        return ingress != null ? kubernetesModelConverter.ingress2Route(ingress) : null;
    }

    @Override
    public Route add(Route route) {
        V1Ingress ingress = kubernetesModelConverter.route2Ingress(route);
        V1Ingress newIngress;
        try {
            newIngress = kubernetesClientService.createIngress(ingress);
        } catch (ApiException e) {
            if (e.getCode() == HttpStatus.CONFLICT.value()) {
                throw new AlreadyExistedException();
            }
            throw new BusinessException(
                "Error occurs when updating the ingress generated by route with name: " + route.getName(), e);
        }
        return kubernetesModelConverter.ingress2Route(newIngress);
    }

    @Override
    public Route update(Route route) {
        V1Ingress ingress = kubernetesModelConverter.route2Ingress(route);
        V1Ingress newIngress;
        try {
            newIngress = kubernetesClientService.replaceIngress(ingress);
        } catch (ApiException e) {
            throw new BusinessException(
                "Error occurs when updating the ingress generated by route with name: " + route.getName(), e);
        }
        return kubernetesModelConverter.ingress2Route(newIngress);
    }

    @Override
    public void delete(String name) {
        try {
            kubernetesClientService.deleteIngress(name);
        } catch (ApiException e) {
            throw new BusinessException("Error occurs when deleting ingress with name: " + name, e);
        }
    }
}
