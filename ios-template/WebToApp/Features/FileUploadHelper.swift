import UIKit
import UniformTypeIdentifiers

class FileUploadHelper: NSObject, UIDocumentPickerDelegate {

    private var completion: (([URL]?) -> Void)?

    private static var activeHelper: FileUploadHelper?

    static func presentPicker(
        from viewController: UIViewController,
        allowsMultipleSelection: Bool,
        completion: @escaping ([URL]?) -> Void
    ) {
        let helper = FileUploadHelper()
        helper.completion = completion
        activeHelper = helper

        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.item], asCopy: true)
        picker.delegate = helper
        picker.allowsMultipleSelection = allowsMultipleSelection
        viewController.present(picker, animated: true)
    }

    // MARK: - UIDocumentPickerDelegate

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        completion?(urls)
        cleanup()
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        completion?(nil)
        cleanup()
    }

    private func cleanup() {
        completion = nil
        FileUploadHelper.activeHelper = nil
    }
}
