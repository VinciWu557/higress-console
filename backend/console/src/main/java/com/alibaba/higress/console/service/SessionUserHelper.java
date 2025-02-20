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

import com.alibaba.higress.console.model.User;

/**
 * @author CH3CHO
 */
public class SessionUserHelper {

    private static final ThreadLocal<User> USER = new ThreadLocal<>();

    public static User getCurrentUser() {
        return USER.get();
    }

    public static void setCurrentUser(User user) {
        USER.set(user);
    }

    public static void clearCurrentUser() {
        USER.remove();
    }
}
