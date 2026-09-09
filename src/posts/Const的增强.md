---
title: Const的增强
date: 2026-08-14 16:00:24
categories: [c++]
tags: [c++]
---

const定义只读常量。

‍

const int a、int const a、const int *a 、int const *a、int* const a、const int *const a的区别

1、const int a 代表一个常型整数

2、int const a 代表一个常型整数

3、const int \*a 指针a是一个指向常整形数的指针，可以改变指向不同的整数，但是不能通过他修改所指向的内存空间的值

4、int const \*a 与3相同

5、int \*const a a 必须在初始化时指向某个整型变量，之后不能改变指针 a 的指向，但可以通过 a 修改它所指向的整数的值。

6、const int\* const a a 既不能改变指向的地址，也不能通过 a 修改它所指向的整数的值

‍
