---
title: EasyExcel（9-类详解）
tag: EasyExcel
category: Java
description: EasyExcel 提供了丰富的核心类和接口，用于实现各种 Excel 操作功能。通过深入了解这些类的结构和用法，可以更好地掌握 EasyExcel 的工作原理，实现更复杂的 Excel 处理需求。本文档详细介绍了 EasyExcel 的核心类、处理器接口及其使用方式。
date: 2024-11-07 18:42:19
---

## 核心类概述

EasyExcel 提供了丰富的核心类和接口，用于实现各种 Excel 操作功能：

- **核心构建类**：用于构建读写操作的工作簿和工作表对象
- **处理器接口**：提供各种钩子方法，允许在 Excel 操作的不同阶段进行自定义处理
- **监听器接口**：用于处理数据读取过程中的回调事件

通过深入了解这些类的结构和用法，可以更好地掌握 EasyExcel 的工作原理，实现更复杂的 Excel 处理需求。

## 常用核心类

EasyExcel 的核心类体系结构清晰，每个类都有明确的职责：

| 类名 | 作用 | 说明 |
|------|------|------|
| **EasyExcel** | 入口类 | 用于构建开始各种操作 |
| **ExcelReaderBuilder** | 读取构建器 | 构建出一个 ReadWorkbook 对象，即一个工作簿对象，对应的是一个 Excel 文件 |
| **ExcelWriterBuilder** | 写入构建器 | 构建出一个 WriteWorkbook 对象，即一个工作簿对象，对应的是一个 Excel 文件 |
| **ExcelReaderSheetBuilder** | 读取Sheet构建器 | 构建出一个 ReadSheet 对象，即一个工作表的对象，对应的 Excel 中的每个 sheet |
| **ExcelWriterSheetBuilder** | 写入Sheet构建器 | 构建出一 WriteSheet 对象，即一个工作表的对象，对应的 Excel 中的每个 sheet |
| **ReadListener** | 读取监听器 | 在每一行读取完毕后都会调用 ReadListener 来处理数据 |
| **WriteHandler** | 写入处理器 | 在每一个操作包括创建单元格、创建表格等都会调用 WriteHandler 来处理数据 |

> ⚠️ **重要说明**：所有配置都是继承的，Workbook 的配置会被 Sheet 继承。所以在用 EasyExcel 设置参数的时候，在 `EasyExcel…sheet()` 方法之前作用域是整个 sheet，之后针对单个 sheet。

## 处理器接口详解

### RowWriteHandler 行写入处理器

`RowWriteHandler` 接口提供了行级别的写入处理能力，可以在行创建的不同阶段进行自定义操作。

```java
public interface RowWriteHandler extends WriteHandler {

    // 行创建之前
    default void beforeRowCreate(RowWriteHandlerContext context) {
        beforeRowCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRowIndex(),
            context.getRelativeRowIndex(), context.getHead());
    }

    // 行创建之前
    default void beforeRowCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                                Integer rowIndex, Integer relativeRowIndex, Boolean isHead) {
    }

    // 在行创建之后
    default void afterRowCreate(RowWriteHandlerContext context) {
        afterRowCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRow(),
            context.getRelativeRowIndex(), context.getHead());
    }

    // 在行创建之后
    default void afterRowCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                               Row row, Integer relativeRowIndex, Boolean isHead) {
    }

    // 在行处置之后
    default void afterRowDispose(RowWriteHandlerContext context) {
        afterRowDispose(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRow(),
            context.getRelativeRowIndex(), context.getHead());
    }

    // 在行处置之后
    default void afterRowDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                                Row row, Integer relativeRowIndex, Boolean isHead) {
    }
}
```

**使用案例：添加错误标记和批注**

```java
/**
 * 错误数据标记处理器
 * 为错误数据添加红色背景和批注说明
 */
public class CommentWriteHandler extends AbstractRowWriteHandler {

    private Map<Integer, FailRecord> failDataMap;
    
    // 构造参数传入错误的数据
    public CommentWriteHandler(Map<Integer, FailRecord> failDataMap) {
        this.failDataMap = failDataMap;
    }

    @Override
    public void afterRowDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                               Row row, Integer relativeRowIndex, Boolean isHead) {
        if (failDataMap.containsKey(row.getRowNum())) {
            if (!isHead) {
                Sheet sheet = writeSheetHolder.getSheet();
                Cell cell = row.getCell(failDataMap.get(row.getRowNum()).getColumn());
                Workbook workbook = sheet.getWorkbook();
                CellStyle cellStyle = workbook.createCellStyle();
                
                // 设置前景填充样式
                cellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                // 设置前景色为红色
                cellStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
                // 设置垂直居中
                cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
                
                Font font = workbook.createFont();
                // 设置字体为红色
                font.setColor(Font.COLOR_RED);
                cellStyle.setFont(font);
                
                // 创建设置批注
                Drawing<?> drawingPatriarch = sheet.createDrawingPatriarch();
                Comment comment = drawingPatriarch.createCellComment(new HSSFClientAnchor(0, 0, 0, 0,
                        (short) row.getRowNum(), failDataMap.get(row.getRowNum()).getColumn(), 
                        (short) (row.getRowNum() + 1), failDataMap.get(row.getRowNum()).getColumn() + 1));
                comment.setString(new HSSFRichTextString(failDataMap.get(row.getRowNum()).getMsg()));
                cell.setCellComment(comment);
                cell.setCellStyle(cellStyle);
            }
        }
    }
}
```

### CellWriteHandler 单元格写入处理器

`CellWriteHandler` 接口提供了单元格级别的写入处理能力，可以在单元格创建和处理的各个阶段进行自定义操作。

```java
public interface CellWriteHandler extends WriteHandler {

    // 单元创建之前，可以使用该方法来设置单元格的样式、字体等信息
    default void beforeCellCreate(CellWriteHandlerContext context) {
        beforeCellCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRow(),
            context.getHeadData(), context.getColumnIndex(), context.getRelativeRowIndex(), context.getHead());
    }

    // 单元创建之前，可以使用该方法来设置单元格的样式、字体等信息
    default void beforeCellCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                                 Row row, Head head, Integer columnIndex, Integer relativeRowIndex, Boolean isHead) {
    }

    // 单元创建后，可以使用该方法来对单元格的内容进行一些处理，例如可以将单元格的内容转换为另一种格式
    default void afterCellCreate(CellWriteHandlerContext context) {
        afterCellCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getCell(),
            context.getHeadData(), context.getRelativeRowIndex(), context.getHead());
    }

    // 单元创建后，可以使用该方法来对单元格的内容进行一些处理，例如可以将单元格的内容转换为另一种格式
    default void afterCellCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                                Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    }

    // 单元数据转换后，可以使用该方法来对单元格的数据进行一些处理，例如可以将单元格的数据转换为另一种类型
    default void afterCellDataConverted(CellWriteHandlerContext context) {
        WriteCellData<?> writeCellData = CollectionUtils.isNotEmpty(context.getCellDataList()) ? context
            .getCellDataList().get(0) : null;
        afterCellDataConverted(context.getWriteSheetHolder(), context.getWriteTableHolder(), writeCellData,
            context.getCell(), context.getHeadData(), context.getRelativeRowIndex(), context.getHead());
    }

    // 单元数据转换后，可以使用该方法来对单元格的数据进行一些处理，例如可以将单元格的数据转换为另一种类型
    default void afterCellDataConverted(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, 
                                       WriteCellData<?> cellData, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    }

    // 单元格处理后（完成后），可以使用该方法来对单元格进行一些清理工作，例如可以释放单元格中使用的资源
    default void afterCellDispose(CellWriteHandlerContext context) {
        afterCellDispose(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getCellDataList(), 
                        context.getCell(), context.getHeadData(), context.getRelativeRowIndex(), context.getHead());
    }

    // 单元格处理后（完成后），可以使用该方法来对单元格进行一些清理工作，例如可以释放单元格中使用的资源
    default void afterCellDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder,
        List<WriteCellData<?>> cellDataList, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    }
}
```

**方法调用顺序和区别**

| 方法 | 调用时机 | 主要用途 |
|------|----------|----------|
| `beforeCellCreate` | 单元格创建之前 | 设置单元格的样式、字体等信息 |
| `afterCellCreate` | 单元格创建之后 | 对单元格内容进行处理，如添加超链接 |
| `afterCellDataConverted` | 单元格数据转换之后 | 对单元格数据进行处理，如格式转换 |
| `afterCellDispose` | 单元格处理完成之后 | 清理工作，释放资源 |

> ⚠️ **注意事项**：
> 1. 这四个方法都是可选的，你可以根据自己的需要来实现它们
> 2. 这四个方法都是线程安全的，你可以放心地在多线程环境中使用它们

**使用案例：自定义单元格样式**

```java
/**
 * 自定义单元格样式处理器
 * 为表头和内容设置不同的样式
 */
@Override
public void afterCellCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder,
                            Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    Workbook workbook = writeSheetHolder.getSheet().getWorkbook(); // 获取 Workbook 对象
    CellStyle cellStyle = workbook.createCellStyle(); // 创建一个 CellStyle 对象
    
    if (isHead) { // 如果是表头，设置对应格式
        WriteCellStyle headWriteCellStyle = new WriteCellStyle();
        headWriteCellStyle.setFillPatternType(FillPatternType.SOLID_FOREGROUND);
        headWriteCellStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex()); // 背景设置
        WriteFont headWriteFont = new WriteFont();
        headWriteFont.setFontHeightInPoints((short) 16);
        headWriteCellStyle.setWriteFont(headWriteFont);

        cellStyle.setFillBackgroundColor(IndexedColors.PALE_BLUE.getIndex());
        Font font = workbook.createFont();
        font.setFontName("宋体");
        font.setFontHeightInPoints((short) 16);
        font.setBold(true);
        cellStyle.setFont(font);
    } else {
        // 设置内容行列对应格式
        if (relativeRowIndex == 0) { // 如果是内容的第一行
            cellStyle.setAlignment(HorizontalAlignment.LEFT);
        } else {
            // 内容其它行
            cellStyle.setAlignment(HorizontalAlignment.CENTER);
        }
        cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        // 边框
        cellStyle.setBorderLeft(BorderStyle.THIN); // 细实线
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);
        cellStyle.setBorderBottom(BorderStyle.THIN);
    }
    cell.setCellStyle(cellStyle);
}
```

### SheetWriteHandler Sheet写入处理器

`SheetWriteHandler` 接口提供了 Sheet 级别的写入处理能力，可以在 Sheet 创建的前后进行自定义操作。

```java
public interface SheetWriteHandler extends WriteHandler {
    // sheet 创建之前
    void beforeSheetCreate(WriteWorkbookHolder var1, WriteSheetHolder var2);
    // sheet 创建之后
    void afterSheetCreate(WriteWorkbookHolder var1, WriteSheetHolder var2);
}
```

**使用案例：设置下拉框**

```java
/**
 * Sheet写入处理器
 * 用于在Sheet创建后设置下拉框等高级功能
 */
public class MySheetWriteHandler implements SheetWriteHandler {

    /**
     * 创建 sheet 页前的操作
     *
     * @param writeWorkbookHolder 工作簿持有者
     * @param writeSheetHolder Sheet持有者
     */
    @Override
    public void beforeSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
        // 可以在这里进行一些初始化操作
    }

    /**
     * 创建 sheet 页后的操作
     *
     * @param writeWorkbookHolder 工作簿持有者
     * @param writeSheetHolder Sheet持有者
     */
    @Override
    public void afterSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
        // 定义选值范围
        String[] sexStrings = new String[]{"男", "女", "未知"};
        
        // 根据 index，形成 map，可插入多个，这个 map 可以由构造参数传入，毕竟不能写死
        Map<Integer, String[]> mapDropDown = new HashMap<>();
        mapDropDown.put(2, sexStrings);
        
        // 获取 sheet 页
        Sheet sheet = writeSheetHolder.getSheet();
        
        // 开始设置下拉框
        DataValidationHelper helper = sheet.getDataValidationHelper();
        for (Map.Entry<Integer, String[]> entry : mapDropDown.entrySet()) {
            /***起始行、终止行、起始列、终止列**/
            CellRangeAddressList addressList = new CellRangeAddressList(1, 9999, entry.getKey(), entry.getKey());
            /***设置下拉框数据**/
            DataValidationConstraint constraint = helper.createExplicitListConstraint(entry.getValue());
            DataValidation dataValidation = helper.createValidation(constraint, addressList);
            /***处理 Excel 兼容性问题**/
            if (dataValidation instanceof XSSFDataValidation) {
                dataValidation.setSuppressDropDownArrow(true);
                dataValidation.setShowErrorBox(true);
            } else {
                dataValidation.setSuppressDropDownArrow(false);
            }
            sheet.addValidationData(dataValidation);
        }
    }
}
```
