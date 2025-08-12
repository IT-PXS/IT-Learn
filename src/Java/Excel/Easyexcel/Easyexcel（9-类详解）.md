---
title: Easyexcel（9-类详解）
tag: EasyExcel
category: Java
description: Easyexlce常用类介绍
date: 2024-11-07 18:42:19
---

## 常用类

1. EasyExcel：入口类，用于构建开始各种操作；
2. ExcelReaderBuilder：构建出一个 ReadWorkbook 对象，即一个工作簿对象，对应的是一个 Excel 文件；
3. ExcelWriterBuilder：构建出一个 WriteWorkbook 对象，即一个工作簿对象，对应的是一个 Excel 文件；
4. ExcelReaderSheetBuilder：构建出一个 ReadSheet 对象，即一个工作表的对象，对应的 Excel 中的每个 sheet，一个工作簿可以有多个工作表；
5. ExcelWriterSheetBuilder：构建出一 WriteSheet 对象，即一个工作表的对象，对应的 Excel 中的每个 sheet，一个工作簿可以有多个工作表；
6. ReadListener：在每一行读取完毕后都会调用 ReadListener 来处理数据，我们可以把调用 service 的代码可以写在其 invoke 方法内部；
7. WriteHandler：在每一个操作包括创建单元格、创建表格等都会调用 WriteHandler 来处理数据，对使用者透明不可见；

所有配置都是继承的，Workbook 的配置会被 Sheet 继承。所以在用 EasyExcel 设置参数的时候，在 EasyExcel…sheet()方法之前作用域是整个 sheet，之后针对单个 sheet

## RowWriteHandler

```java
public interface RowWriteHandler extends WriteHandler {

	//行创建之前
    default void beforeRowCreate(RowWriteHandlerContext context) {
        beforeRowCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRowIndex(),
            context.getRelativeRowIndex(), context.getHead());
    }

	//行创建之前
    default void beforeRowCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, Integer rowIndex, Integer relativeRowIndex, Boolean isHead) {
    }

	//在行创建之后
    default void afterRowCreate(RowWriteHandlerContext context) {
        afterRowCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRow(),
            context.getRelativeRowIndex(), context.getHead());
    }

	//在行创建之后
    default void afterRowCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, Row row, Integer relativeRowIndex, Boolean isHead) {
    }

	//在行处置之后
    default void afterRowDispose(RowWriteHandlerContext context) {
        afterRowDispose(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRow(),
            context.getRelativeRowIndex(), context.getHead());
    }

	//在行处置之后
    default void afterRowDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, Row row, Integer relativeRowIndex, Boolean isHead) {
    }
}
```

**使用案例**

```java
public class CommentWriteHandler extends AbstractRowWriteHandler {

    private Map<Integer, FailRecord> failDataMap;
	// 构造参数传入错误的数据
    public CommentWriteHandler(Map<Integer, FailRecord> failDataMap) {
        this.failDataMap = failDataMap;
    }

    @Override
    public void afterRowDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, Row row,Integer relativeRowIndex, Boolean isHead) {
        if (failDataMap.containsKey(row.getRowNum())) {
            if (!isHead) {
                Sheet sheet = writeSheetHolder.getSheet();
                Cell cell = row.getCell(failDataMap.get(row.getRowNum()).getColumn());
                Workbook workbook = sheet.getWorkbook();
                CellStyle cellStyle = workbook.createCellStyle();
                //设置前景填充样式
                cellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                //设置前景色为红色
                cellStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
                //设置垂直居中
                cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
                Font font = workbook.createFont();
                //设置字体为红色
                font.setColor(Font.COLOR_RED);
                cellStyle.setFont(font);
				//创建设置批注
                Drawing<?> drawingPatriarch = sheet.createDrawingPatriarch();
                Comment comment = drawingPatriarch.createCellComment(new HSSFClientAnchor(0, 0, 0, 0,
                        (short) row.getRowNum(), failDataMap.get(row.getRowNum()).getColumn(), (short) (row.getRowNum() + 1), failDataMap.get(row.getRowNum()).getColumn() + 1));
                comment.setString(new HSSFRichTextString(failDataMap.get(row.getRowNum()).getMsg()));
                cell.setCellComment(comment);
                cell.setCellStyle(cellStyle);
            }
        }
    }
}
```

## CellWriteHandler

```java
public interface CellWriteHandler extends WriteHandler {

    //单元创建之前，可以使用该方法来设置单元格的样式、字体等信息。
    default void beforeCellCreate(CellWriteHandlerContext context) {
        beforeCellCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getRow(),
            context.getHeadData(), context.getColumnIndex(), context.getRelativeRowIndex(), context.getHead());
    }

	//单元创建之前，可以使用该方法来设置单元格的样式、字体等信息。
    default void beforeCellCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, Row row, Head head, Integer columnIndex, Integer relativeRowIndex, Boolean isHead) {
    }

    //单元创建后，可以使用该方法来对单元格的内容进行一些处理，例如可以将单元格的内容转换为另一种格式
    default void afterCellCreate(CellWriteHandlerContext context) {
        afterCellCreate(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getCell(),
            context.getHeadData(), context.getRelativeRowIndex(), context.getHead());
    }

	//单元创建后，可以使用该方法来对单元格的内容进行一些处理，例如可以将单元格的内容转换为另一种格式
    default void afterCellCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    }

	//单元数据转换后，可以使用该方法来对单元格的数据进行一些处理，例如可以将单元格的数据转换为另一种类型
    default void afterCellDataConverted(CellWriteHandlerContext context) {
        WriteCellData<?> writeCellData = CollectionUtils.isNotEmpty(context.getCellDataList()) ? context
            .getCellDataList().get(0) : null;
        afterCellDataConverted(context.getWriteSheetHolder(), context.getWriteTableHolder(), writeCellData,
            context.getCell(), context.getHeadData(), context.getRelativeRowIndex(), context.getHead());
    }

	//单元数据转换后，可以使用该方法来对单元格的数据进行一些处理，例如可以将单元格的数据转换为另一种类型
    default void afterCellDataConverted(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, WriteCellData<?> cellData, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    }

	//单元格处理后（完成后），可以使用该方法来对单元格进行一些清理工作，例如可以释放单元格中使用的资源
    default void afterCellDispose(CellWriteHandlerContext context) {
        afterCellDispose(context.getWriteSheetHolder(), context.getWriteTableHolder(), context.getCellDataList(), context.getCell(), context.getHeadData(), context.getRelativeRowIndex(), context.getHead());
    }

	//单元格处理后（完成后），可以使用该方法来对单元格进行一些清理工作，例如可以释放单元格中使用的资源
    default void afterCellDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder,
        List<WriteCellData<?>> cellDataList, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    }
}
```

注意：

1. 这四个方法都是可选的，你可以根据自己的需要来实现它们。
2. 这四个方法都是线程安全的，你可以放心地在多线程环境中使用它们。

**区别**

1. beforeCellCreate 方法在单元格创建之前调用，而 afterCellCreate 方法在单元格创建之后调用。
2. afterCellDataConverted 方法在单元格数据转换之后调用，而 afterCellDispose 方法在单元格处理完成之后调用。
3. beforeCellCreate 方法和 afterCellCreate 方法主要用于设置单元格的样式和内容，而 afterCellDataConverted 方法和 afterCellDispose 方法主要用于对单元格的数据进行处理。

**使用案例**

如果你想在单元格头部添加背景色，你可以在 beforeCellCreate 方法中设置单元格的样式。如果你想将单元格中的数字转换为百分比，你可以在 afterCellDataConverted 方法中将单元格的数据转换为百分比。如果你想在单元格中添加超链接，你可以在 afterCellCreate 方法中添加超链接。

```java
@Override
public void afterCellCreate(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder,
                            Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
    Workbook workbook = writeSheetHolder.getSheet().getWorkbook(); // 获取 Workbook 对象
    CellStyle cellStyle = workbook.createCellStyle(); // 创建一个 CellStyle 对象
    if (isHead) { // 如果是头，设置对应格式
        WriteCellStyle headWriteCellStyle = new WriteCellStyle();
        headWriteCellStyle.setFillPatternType(FillPatternType.SOLID_FOREGROUND);
        headWriteCellStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());// 背景设置
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
        cellStyle.setBorderLeft(BorderStyle.THIN);//细实线
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);
        cellStyle.setBorderBottom(BorderStyle.THIN);
    }
    cell.setCellStyle(cellStyle);
}
```

## SheetWriteHandler

```java
public interface SheetWriteHandler extends WriteHandler {
    //sheet 创建之前
    void beforeSheetCreate(WriteWorkbookHolder var1, WriteSheetHolder var2);
    //sheet 创建之后
    void afterSheetCreate(WriteWorkbookHolder var1, WriteSheetHolder var2);
}
```

**使用案例**

```java
public class MySheetWriteHandler implements SheetWriteHandler {

    /**
     * 创建 sheet 页前的操作
     *
     * @param writeWorkbookHolder
     * @param writeSheetHolder
     */
    @Override
    public void beforeSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
    }

    /**
     * 创建 sheet 页后的操作
     *
     * @param writeWorkbookHolder
     * @param writeSheetHolder
     */
    @Override

    public void afterSheetCreate(WriteWorkbookHolder writeWorkbookHolder, WriteSheetHolder writeSheetHolder) {
        //定义选值范围
        String[] sexStrings = new String[]{"男", "女", "未知"};
        //根据 index，形成 map，可插入多个  这个 map 可以由构造参数传入，毕竟不能写死
        Map<Integer, String[]> mapDropDown = new HashMap<>();
        mapDropDown.put(2, sexStrings);
        //获取 sheet 页
        Sheet sheet = writeSheetHolder.getSheet();
        ///开始设置下拉框
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

